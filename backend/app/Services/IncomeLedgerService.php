<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IncomeLedgerService
{
    /**
     * Record a new income entry.
     */
    public static function record(
        string $sourceType,
        string $sourceId,
        string $sourceRef,
        ?string $customerName,
        int $amount,
        string $paymentMethod,
        ?string $collectedBy,
        string $collectedAt,
        ?string $notes = null
    ): void {
        DB::table('income_entries')->insert([
            'id' => Str::uuid(),
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'source_ref' => $sourceRef,
            'customer_name' => $customerName,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'collected_by' => $collectedBy,
            'collected_at' => $collectedAt,
            'notes' => $notes,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
