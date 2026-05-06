<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = SystemLog::with('user')
            ->orderBy('recorded_at', 'desc')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }
}
