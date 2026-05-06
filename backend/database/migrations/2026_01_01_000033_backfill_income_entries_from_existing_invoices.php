<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // One-time data migration:
        // For every existing service invoice with status='paid',
        // insert a row into income_entries.
        $invoices = DB::table('invoices')
            ->where('status', 'paid')
            ->get();

        foreach ($invoices as $inv) {
            // Find the last payment for payment_method and collected_by
            $payment = DB::table('payments')
                ->where('invoice_id', $inv->id)
                ->orderBy('created_at', 'desc')
                ->first();

            $owner = DB::table('service_cards')
                ->join('owners', 'service_cards.owner_id', '=', 'owners.id')
                ->where('service_cards.id', $inv->service_card_id)
                ->select('owners.full_name')
                ->first();

            DB::table('income_entries')->insert([
                'id' => Str::uuid(),
                'source_type' => 'service_invoice',
                'source_id' => $inv->id,
                'source_ref' => $inv->invoice_no,
                'customer_name' => $owner?->full_name ?? 'Unknown Customer',
                'amount' => $inv->total_amount,
                'payment_method' => $payment?->payment_method ?? 'cash',
                'collected_by' => $payment?->paid_by ?? null,
                'collected_at' => $payment?->paid_at ?? $inv->created_at,
                'notes' => 'Backfilled from paid invoice',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('income_entries')->where('notes', 'Backfilled from paid invoice')->delete();
    }
};
