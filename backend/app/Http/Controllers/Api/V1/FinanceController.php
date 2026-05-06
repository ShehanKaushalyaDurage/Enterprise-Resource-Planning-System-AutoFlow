<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CapitalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $totalIncome = (int) DB::table('income_entries')->sum('amount');
        $totalExpenses = (int) DB::table('expense_entries')->sum('amount');
        $totalCapital = (int) DB::table('capital_entries')->sum('amount');

        $profit = $totalIncome - $totalExpenses;
        $activeBalance = $profit + $totalCapital;

        return response()->json([
            'success' => true,
            'data' => [
                'income' => [
                    'total_income' => $totalIncome
                ],
                'expenses' => [
                    'total_expenses' => $totalExpenses
                ],
                'net_profit' => $profit,
                'total_capital' => $totalCapital,
                'active_balance' => $activeBalance,
            ]
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $sql = "
            WITH ledger AS (
                SELECT
                    id,
                    'income' AS tx_type,
                    source_type,
                    amount,
                    description,
                    recorded_at AS tx_date
                FROM income_entries
                UNION ALL
                SELECT
                    id,
                    'expense' AS tx_type,
                    source_type,
                    -amount AS amount,
                    description,
                    recorded_at AS tx_date
                FROM expense_entries
                UNION ALL
                SELECT
                    id,
                    'capital' AS tx_type,
                    'contribution' AS source_type,
                    amount,
                    description,
                    recorded_at AS tx_date
                FROM capital_entries
            )
            SELECT
                id,
                tx_type,
                source_type,
                amount,
                description,
                tx_date,
                SUM(amount) OVER (ORDER BY tx_date ASC, id ASC) AS running_balance
            FROM ledger
            ORDER BY tx_date DESC, id DESC;
        ";

        $results = DB::select($sql);

        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }

    public function storeCapital(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
            'investor_name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        $entry = CapitalEntry::create([
            'id' => Str::uuid(),
            'amount' => $data['amount'],
            'investor_name' => $data['investor_name'],
            'description' => $data['description'] ?? null,
            'recorded_by' => $request->user()->id,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $entry,
            'message' => 'Capital contribution recorded.'
        ], 201);
    }
}
