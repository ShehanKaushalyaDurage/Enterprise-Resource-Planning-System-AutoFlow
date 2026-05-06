<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ServiceCard;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    /**
     * Generate a sequential invoice number: INV-YYYY-XXXXX
     */
    public function generateInvoiceNo(): string
    {
        $year = now()->year;
        $prefix = "INV-{$year}-";

        $last = Invoice::where('invoice_no', 'like', "{$prefix}%")
            ->orderBy('invoice_no', 'desc')
            ->value('invoice_no');

        $seq = $last ? (int) substr($last, -5) + 1 : 1;

        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Create an invoice from a service card
     */
    public function createFromServiceCard(ServiceCard $card): Invoice
    {
        $subtotal = $card->items->sum('line_total');
        // Item 5: Tax removal system-wide
        $total = $subtotal;

        $dueDays = SystemSetting::get('invoice_due_days');
        $dueDate = null;
        if (!is_null($dueDays) && (int)$dueDays > 0) {
            $dueDate = now()->addDays((int)$dueDays)->toDateString();
        }

        $invoice = Invoice::create([
            'invoice_no'      => $this->generateInvoiceNo(),
            'service_card_id' => $card->id,
            'subtotal'        => $subtotal,
            'discount_amount' => 0,
            'total_amount'    => $total,
            'paid_amount'     => 0,
            'status'          => 'unpaid',
            'due_date'        => $dueDate,
        ]);

        if (class_exists(\App\Services\SystemLogService::class)) {
            \App\Services\SystemLogService::crud(
                'created',
                'Invoice',
                $invoice->id,
                ['total_amount' => $invoice->total_amount],
                auth()->user()
            );
        }

        return $invoice;
    }

    /**
     * Apply a payment to an invoice and update its status
     */
    public function applyPayment(Invoice $invoice, int $amount, string $method, ?string $reference, string $collectedBy, ?string $notes = null): Payment
    {
        return DB::transaction(function () use ($invoice, $amount, $method, $reference, $collectedBy, $notes) {
            $balance = $invoice->balance_amount;

            if ($amount > $balance) {
                throw new \InvalidArgumentException("Payment amount ({$amount}) exceeds balance ({$balance}).");
            }

            $payment = Payment::create([
                'invoice_id'     => $invoice->id,
                'amount'         => $amount,
                'payment_method' => $method,
                'reference_no'   => $reference,
                'paid_at'        => now(),
                'collected_by'   => $collectedBy,
                'notes'          => $notes,
            ]);

            $invoice->increment('paid_amount', $amount);
            $invoice->refresh();

            $invoice->status = match (true) {
                $invoice->paid_amount >= $invoice->total_amount => 'paid',
                $invoice->paid_amount > 0                       => 'partial',
                default                                         => 'unpaid',
            };
            $invoice->save();

            // Fetch the owner's full name if it exists via the service card
            $customerName = 'Unknown';
            if ($invoice->serviceCard && $invoice->serviceCard->owner) {
                $customerName = $invoice->serviceCard->owner->full_name;
            }

            // Gap 1: Record in the unified income entries ledger
            IncomeLedgerService::record(
                'service_invoice',
                $invoice->id,
                $invoice->invoice_no,
                $customerName,
                $amount,
                $method,
                $collectedBy,
                now()->toDateTimeString(),
                'Payment applied'
            );

            // Item 9 CRUD logging
            if (class_exists(\App\Services\SystemLogService::class)) {
                \App\Services\SystemLogService::crud(
                    'payment_recorded',
                    'Invoice',
                    $invoice->id,
                    ['amount' => $amount],
                    auth()->user()
                );
            }

            return $payment;
        });
    }

    /**
     * Void an invoice (admin only)
     */
    public function void(Invoice $invoice, string $reason, string $voidedBy): void
    {
        if ($invoice->status === 'voided') {
            throw new \InvalidArgumentException('Invoice is already voided.');
        }

        $invoice->update([
            'status'      => 'voided',
            'void_reason' => $reason,
            'voided_by'   => $voidedBy,
            'voided_at'   => now(),
        ]);

        if (class_exists(\App\Services\SystemLogService::class)) {
            \App\Services\SystemLogService::crud(
                'voided',
                'Invoice',
                $invoice->id,
                ['void_reason' => $reason],
                auth()->user()
            );
        }
    }

    /**
     * Recalculate invoice totals with discount
     */
    public function recalculate(Invoice $invoice, int $discountAmount): void
    {
        $total = max(0, $invoice->subtotal - $discountAmount);
        $invoice->update([
            'discount_amount' => $discountAmount,
            'total_amount'    => $total,
        ]);
    }
}
