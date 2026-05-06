<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StockAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockAlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockAlert::with('stockItem')
            ->when(!$request->boolean('all'), fn($q) => $q->unacknowledged())
            ->latest('triggered_at');

        $alerts = $query->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $alerts]);
    }

    public function acknowledge(Request $request, StockAlert $stockAlert): JsonResponse
    {
        if ($stockAlert->isAcknowledged()) {
            return response()->json(['success' => false, 'message' => 'Already acknowledged.'], 422);
        }

        $stockAlert->update([
            'acknowledged_by' => $request->user()->id,
            'acknowledged_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $stockAlert, 'message' => 'Alert acknowledged.']);
    }
}
