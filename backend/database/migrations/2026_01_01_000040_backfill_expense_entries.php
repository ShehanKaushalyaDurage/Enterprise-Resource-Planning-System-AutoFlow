<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Backfill from grn_payments
        $grnPayments = DB::table('grn_payments')->get();
        foreach ($grnPayments as $pay) {
            DB::table('expense_entries')->insert([
                'id' => Str::uuid(),
                'amount' => $pay->amount,
                'category' => 'grn',
                'source_type' => 'grn_payments',
                'source_id' => $pay->id,
                'description' => "GRN payment: {$pay->reference_no}",
                'recorded_by' => $pay->paid_by,
                'recorded_at' => $pay->paid_at,
                'created_at' => $pay->created_at ?? now(),
                'updated_at' => $pay->updated_at ?? now(),
            ]);
        }

        // 2. Backfill from petty_cash_entries
        $pettyEntries = DB::table('petty_cash_entries')->get();
        foreach ($pettyEntries as $entry) {
            DB::table('expense_entries')->insert([
                'id' => Str::uuid(),
                'amount' => $entry->amount,
                'category' => 'petty_cash',
                'source_type' => 'petty_cash_entries',
                'source_id' => $entry->id,
                'description' => "Petty cash payout: {$entry->reason}",
                'recorded_by' => $entry->issued_by,
                'recorded_at' => $entry->issued_at,
                'created_at' => $entry->created_at ?? now(),
                'updated_at' => $entry->updated_at ?? now(),
            ]);
        }

        // 3. Backfill from old expenses table if exists and not already backfilled
        if (Schema::hasTable('expenses')) {
            $oldExpenses = DB::table('expenses')->whereNotIn('expense_type', ['grn', 'petty_cash'])->get();
            $firstUser = DB::table('users')->orderBy('created_at')->value('id');
            if ($firstUser) {
                foreach ($oldExpenses as $exp) {
                    DB::table('expense_entries')->insert([
                        'id' => Str::uuid(),
                        'amount' => $exp->amount,
                        'category' => 'manual',
                        'source_type' => 'general',
                        'source_id' => $exp->id,
                        'description' => $exp->description,
                        'recorded_by' => $firstUser,
                        'recorded_at' => $exp->created_at ?? now(),
                        'created_at' => $exp->created_at ?? now(),
                        'updated_at' => $exp->updated_at ?? now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('expense_entries')->truncate();
    }
};
