<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $service)
    {}

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['serviceCard.vehicle', 'serviceCard.owner', 'serviceCard.serviceType'])
            ->latest();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('vehicle_no')) {
            $query->whereHas('serviceCard.vehicle', fn($q) => $q->where('vehicle_no', 'ilike', "%{$request->vehicle_no}%"));
        }
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $invoices = $query->paginate($request->integer('per_page', 25));

        // Monthly summary
        $summary = [
            'total_invoiced'    => Invoice::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->sum('total_amount'),
            'total_collected'   => Invoice::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->sum('paid_amount'),
            'total_outstanding' => Invoice::whereIn('status', ['unpaid', 'partial'])->sum(\DB::raw('total_amount - paid_amount')),
        ];

        return response()->json(['success' => true, 'data' => $invoices, 'meta' => ['summary' => $summary]]);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load(['serviceCard.vehicle', 'serviceCard.owner', 'serviceCard.items', 'serviceCard.serviceType', 'payments.collectedBy', 'voidedBy']);

        return response()->json(['success' => true, 'data' => $invoice]);
    }

    public function void(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5'],
        ]);

        $this->service->void($invoice, $data['reason'], $request->user()->id);

        return response()->json(['success' => true, 'data' => $invoice->fresh(), 'message' => 'Invoice voided.']);
    }
}
