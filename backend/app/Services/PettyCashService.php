<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\PettyCashEntry;
use App\Models\PettyCashSession;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;

class PettyCashService
{
    public function openSession(string $openedBy, ?int $dailyLimit = null): PettyCashSession
    {
        $existing = PettyCashSession::today();
        if ($existing) {
            throw new \InvalidArgumentException('A session for today already exists.');
        }

        $limit = $dailyLimit ?? (int) SystemSetting::get('daily_petty_cash_limit', 500000); // cents

        return PettyCashSession::create([
            'session_date' => today(),
            'daily_limit'  => $limit,
            'total_spent'  => 0,
            'opened_by'    => $openedBy,
        ]);
    }

    public function issueEntry(PettyCashSession $session, array $data, string $issuedBy): PettyCashEntry
    {
        return DB::transaction(function () use ($session, $data, $issuedBy) {
            if ($session->isClosed()) {
                throw new \InvalidArgumentException('Session is closed.');
            }

            $amount = (int) $data['amount'];

            if ($amount > $session->remaining) {
                throw new \InvalidArgumentException(
                    "Amount ({$amount}) exceeds remaining balance ({$session->remaining})."
                );
            }

            $entry = PettyCashEntry::create([
                'session_id' => $session->id,
                'reason'     => $data['reason'],
                'amount'     => $amount,
                'issued_to'  => $data['issued_to'] ?? null,
                'issued_by'  => $issuedBy,
                'issued_at'  => now(),
                'receipt_no' => $data['receipt_no'] ?? null,
            ]);

            $session->increment('total_spent', $amount);

            app(\App\Services\ExpenseLedgerService::class)->record(
                $amount,
                'petty_cash',
                'petty_cash_entries',
                $entry->id,
                "Petty cash payout: {$entry->reason}",
                $issuedBy,
                now()
            );

            return $entry;
        });
    }
}
