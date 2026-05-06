<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GrnHeader;
use App\Services\GrnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GrnPaymentController extends Controller
{
    public function __construct(private readonly GrnService $service)
    {}

    public function store(Request $request, GrnHeader $grn): JsonResponse
    {
        $data = $request->validate([
            'amount'         => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', 'in:cash,card,bank_transfer'],
            'reference_no'   => ['nullable', 'string'],
        ]);

        $payment = $this->service->addPayment(
            $grn,
            $data['amount'],
            $data['payment_method'],
            $data['reference_no'] ?? null,
            $request->user()->id,
        );

        return response()->json(['success' => true, 'data' => ['payment' => $payment, 'grn' => $grn->fresh()], 'message' => 'GRN payment recorded.'], 201);
    }
}
