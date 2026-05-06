<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StockAlert;
use App\Models\StockItem;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockItemController extends Controller
{
    public function __construct(private readonly StockService $stockService)
    {}

    public function index(Request $request): JsonResponse
    {
        $query = StockItem::with('supplier')->active();

        if ($request->filled('search')) {
            $query->search($request->search);
        }
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        if ($request->has('status')) {
            match ($request->status) {
                'low'  => $query->whereRaw('current_qty <= reorder_level AND current_qty > 0'),
                'out'  => $query->where('current_qty', '<=', 0),
                'ok'   => $query->whereRaw('current_qty > reorder_level'),
                default => null,
            };
        }

        if ($request->filled('base_code')) {
            $query->where('base_code', $request->base_code);
        }

        // Handle latest_only query param
        $latestOnly = $request->boolean('latest_only', true);
        if ($request->has('include_versions') || $request->has('base_code')) {
            $latestOnly = false;
        }

        if ($latestOnly) {
            $query->where('is_latest_version', true);
        }

        $items = $query->orderBy('name')->paginate($request->integer('per_page', 25));

        if ($request->boolean('include_versions', false)) {
            // Transform to include all versions grouped
            $transformed = collect($items->items())->groupBy('base_code')->map(function ($groupedItems, $baseCode) {
                $latest = $groupedItems->where('is_latest_version', true)->first() ?: $groupedItems->first();
                return [
                    'id' => $latest->id,
                    'base_code' => $baseCode,
                    'name' => $latest->name,
                    'category' => $latest->category,
                    'unit_of_measure' => $latest->unit_of_measure,
                    'current_qty' => $groupedItems->sum('current_qty'),
                    'latest_version' => $latest,
                    'versions' => $groupedItems->values(),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'current_page' => $items->currentPage(),
                    'data' => $transformed,
                    'first_page_url' => $items->url(1),
                    'from' => $items->firstItem(),
                    'last_page' => $items->lastPage(),
                    'last_page_url' => $items->url($items->lastPage()),
                    'links' => $items->linkCollection(),
                    'next_page_url' => $items->nextPageUrl(),
                    'path' => $items->path(),
                    'per_page' => $items->perPage(),
                    'prev_page_url' => $items->previousPageUrl(),
                    'to' => $items->lastItem(),
                    'total' => $items->total(),
                ]
            ]);
        }

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function versions(StockItem $stockItem): JsonResponse
    {
        $versions = StockItem::where('base_code', $stockItem->base_code)
            ->with('supplier')
            ->orderBy('version_number', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'base_code' => $stockItem->base_code,
                'versions' => $versions,
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_code'       => ['required', 'string', 'unique:stock_items,item_code'],
            'name'            => ['required', 'string'],
            'category'        => ['required', 'string'],
            'unit_of_measure' => ['required', 'in:pcs,liters,kg,meters'],
            'current_qty'     => ['nullable', 'numeric', 'min:0'],
            'reorder_level'   => ['required', 'numeric', 'min:0'],
            'reorder_qty'     => ['required', 'numeric', 'min:0'],
            'unit_cost'       => ['required', 'integer', 'min:0'],
            'unit_price'      => ['required', 'integer', 'min:0'],
            'supplier_id'     => ['nullable', 'uuid', 'exists:suppliers,id'],
            'location'        => ['nullable', 'string'],
        ]);

        // Validation against duplicate versions
        if (preg_match('/^(.*)-V(\d+)$/', $data['item_code'], $matches)) {
            $base = $matches[1];
            $version = (int)$matches[2];
        } else {
            $base = $data['item_code'];
            $version = 1;
        }

        $exists = StockItem::where('base_code', $base)->where('version_number', $version)->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => "Base code {$base} already has versions. Use GRN to receive a new batch with updated pricing."], 422);
        }

        $item = StockItem::create($data);

        return response()->json(['success' => true, 'data' => $item, 'message' => 'Stock item created.'], 201);
    }

    public function show(StockItem $stockItem): JsonResponse
    {
        $stockItem->load(['supplier', 'movements' => fn($q) => $q->with('doneBy')->latest('done_at')->limit(50), 'alerts' => fn($q) => $q->unacknowledged()]);

        return response()->json(['success' => true, 'data' => $stockItem->append('stock_status')]);
    }

    public function update(Request $request, StockItem $stockItem): JsonResponse
    {
        if ($request->has('unit_cost') || $request->has('unit_price')) {
            return response()->json(['success' => false, 'message' => 'Price changes are not allowed without a GRN.'], 422);
        }

        $data = $request->validate([
            'name'            => ['sometimes', 'string'],
            'category'        => ['sometimes', 'string'],
            'unit_of_measure' => ['sometimes', 'in:pcs,liters,kg,meters'],
            'reorder_level'   => ['sometimes', 'numeric', 'min:0'],
            'reorder_qty'     => ['sometimes', 'numeric', 'min:0'],
            'supplier_id'     => ['nullable', 'uuid', 'exists:suppliers,id'],
            'location'        => ['nullable', 'string'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        $stockItem->update($data);

        return response()->json(['success' => true, 'data' => $stockItem, 'message' => 'Stock item updated.']);
    }

    public function adjust(Request $request, StockItem $stockItem): JsonResponse
    {
        $data = $request->validate([
            'type'      => ['required', 'in:addition,reduction'],
            'quantity'  => ['required', 'numeric', 'min:0.01'],
            'reason'    => ['required', 'string'],
            'reference' => ['nullable', 'string'],
        ]);

        $movement = $this->stockService->adjust(
            $stockItem,
            $data['type'],
            $data['quantity'],
            $data['reason'],
            $data['reference'] ?? null,
            $request->user()->id,
        );

        return response()->json(['success' => true, 'data' => ['movement' => $movement, 'stock_item' => $stockItem->fresh()], 'message' => 'Stock adjusted.']);
    }
}
