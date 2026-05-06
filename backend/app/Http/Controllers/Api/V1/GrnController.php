<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GrnHeader;
use App\Services\GrnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GrnController extends Controller
{
    public function __construct(private readonly GrnService $service)
    {}

    public function index(Request $request): JsonResponse
    {
        $query = GrnHeader::with(['supplier', 'receivedBy', 'payments'])->latest();

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('received_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('received_at', '<=', $request->to_date);
        }

        $grns = $query->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $grns]);
    }

    public function summary(): JsonResponse
    {
        $thisMonth = now()->month;
        $thisYear = now()->year;

        $totalValue = GrnHeader::whereMonth('received_at', $thisMonth)->whereYear('received_at', $thisYear)->sum('total_amount');
        $totalPaid = \App\Models\GrnPayment::whereMonth('paid_at', $thisMonth)->whereYear('paid_at', $thisYear)->sum('amount');
        $totalBalance = GrnHeader::sum('total_amount') - \App\Models\GrnPayment::sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_grn_value_this_month' => (int)$totalValue,
                'total_paid_this_month'      => (int)$totalPaid,
                'total_outstanding'          => (int)$totalBalance
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id'           => ['required', 'uuid', 'exists:suppliers,id'],
            'received_at'           => ['required', 'date'],
            'notes'                 => ['nullable', 'string'],
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.stock_item_id' => ['required', 'uuid', 'exists:stock_items,id'],
            'items.*.ordered_qty'   => ['required', 'numeric', 'min:0'],
            'items.*.received_qty'  => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_cost'     => ['required', 'integer', 'min:0'],
        ]);

        $grn = $this->service->create($data, $request->user()?->id);

        return response()->json(['success' => true, 'data' => $grn, 'message' => "GRN {$grn->grn_no} issued."], 201);
    }

    public function show(GrnHeader $grn): JsonResponse
    {
        $grn->load(['supplier', 'receivedBy', 'items.stockItem', 'items.resultingStockItem', 'payments.paidBy']);
        return response()->json(['success' => true, 'data' => $grn]);
    }
}
