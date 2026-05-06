<?php

namespace App\Services;

use App\Models\ExpenseEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExpenseLedgerService
{
    /**
     * Record a new expense in the expense_entries ledger.
     */
    public function record(
        int $amount,
        string $category,
        string $sourceType,
        ?string $sourceId,
        string $description,
        string $recordedBy,
        ?string $recordedAt = null
    ): ExpenseEntry {
        return DB::transaction(function () use ($amount, $category, $sourceType, $sourceId, $description, $recordedBy, $recordedAt) {
            return ExpenseEntry::create([
                'id' => Str::uuid(),
                'amount' => $amount,
                'category' => $category,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'description' => $description,
                'recorded_by' => $recordedBy,
                'recorded_at' => $recordedAt ?: now(),
            ]);
        });
    }
}
