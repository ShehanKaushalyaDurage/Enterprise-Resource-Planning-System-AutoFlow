<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StockSaleInvoice;
use App\Services\StockSaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockSaleController extends Controller
{
    public function __construct(private readonly StockSaleService $stockSaleService)
    {}

    public function index(Request $request): JsonResponse
    {
        $sales = StockSaleInvoice::query()
            ->with(['items.stockItem', 'soldBy', 'collectedBy'])
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where('invoice_no', 'ilike', "%{$request->search}%")
                  ->orWhere('customer_name', 'ilike', "%{$request->search}%");
            })
            ->latest()
            ->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $sales]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name'    => ['required', 'string', 'max:255'],
            'customer_contact' => ['nullable', 'string'],
            'customer_address' => ['nullable', 'string'],
            'subtotal'         => ['required', 'integer', 'min:0'],
            'discount_amount'  => ['nullable', 'integer', 'min:0'],
            'total_amount'     => ['required', 'integer', 'min:0'],
            'notes'            => ['nullable', 'string'],
            'payment_method'   => ['required', 'string', 'in:cash,card,bank_transfer'],
            'tendered_amount'  => ['required_if:payment_method,cash', 'integer', 'min:0'],
            'items'            => ['required', 'array', 'min:1'],
            'items.*.stock_item_id' => ['required', 'exists:stock_items,id'],
            'items.*.quantity'      => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price'    => ['required', 'integer', 'min:0'],
            'items.*.line_total'    => ['required', 'integer', 'min:0'],
        ]);

        try {
            $invoice = $this->stockSaleService->createSale($data, $request->user()?->id);
            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Stock sale recorded successfully.'
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(StockSaleInvoice $stockSale): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $stockSale->load(['items.stockItem', 'collectedBy', 'soldBy'])
        ]);
    }

    public function void(StockSaleInvoice $stockSale, Request $request): JsonResponse
    {
        try {
            $invoice = $this->stockSaleService->voidSale($stockSale, $request->user()?->id);
            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Stock sale invoice successfully voided.'
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
