<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly InvoiceService $service)
    {}

    public function store(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->status === 'voided') {
            return response()->json(['success' => false, 'message' => 'Cannot add payment to voided invoice.'], 422);
        }

        if ($invoice->status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Invoice is already fully paid.'], 422);
        }

        $data = $request->validate([
            'amount'         => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', 'in:cash,card,bank_transfer'],
            'reference_no'   => ['nullable', 'string', 'max:100'],
            'notes'          => ['nullable', 'string'],
        ]);

        $payment = $this->service->applyPayment(
            $invoice,
            $data['amount'],
            $data['payment_method'],
            $data['reference_no'] ?? null,
            $request->user()->id,
            $data['notes'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'payment' => $payment,
                'invoice' => $invoice->fresh()->load('payments'),
            ],
            'message' => 'Payment recorded.',
        ], 201);
    }
}
