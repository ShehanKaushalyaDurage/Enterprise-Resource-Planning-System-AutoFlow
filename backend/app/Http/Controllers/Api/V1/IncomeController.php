<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IncomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('income_entries')
            ->leftJoin('users', 'income_entries.collected_by', '=', 'users.id')
            ->select('income_entries.*', 'users.name as collected_by_name')
            ->when($request->filled('date_from'), fn($q) => $q->where('income_entries.collected_at', '>=', $request->date_from . ' 00:00:00'))
            ->when($request->filled('date_to'), fn($q) => $q->where('income_entries.collected_at', '<=', $request->date_to . ' 23:59:59'))
            ->when($request->filled('source_type'), fn($q) => $q->where('income_entries.source_type', $request->source_type))
            ->orderBy('income_entries.collected_at', 'desc');

        $totalIncome = (int)$query->sum('income_entries.amount');

        $entries = $query->paginate($request->integer('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $entries,
            'meta' => [
                'total_income' => $totalIncome
            ]
        ]);
    }
}
