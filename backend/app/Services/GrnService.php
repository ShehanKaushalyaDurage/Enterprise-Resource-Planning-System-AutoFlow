<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\GrnHeader;
use App\Models\GrnItem;
use App\Models\GrnPayment;
use App\Models\StockItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Jobs\NotifyNewStockVersion;

class GrnService
{
    public function __construct(private readonly StockService $stockService)
    {}

    public function generateGrnNo(): string
    {
        $year   = now()->year;
        $prefix = "GRN-{$year}-";
        $last   = GrnHeader::where('grn_no', 'like', "{$prefix}%")
            ->orderBy('grn_no', 'desc')
            ->value('grn_no');
        $seq = $last ? (int) substr($last, -5) + 1 : 1;
        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    public function create(array $data, string $receivedBy): GrnHeader
    {
        return DB::transaction(function () use ($data, $receivedBy) {
            $grn = GrnHeader::create([
                'grn_no'         => $this->generateGrnNo(),
                'supplier_id'    => $data['supplier_id'],
                'received_by'    => $receivedBy,
                'received_at'    => $data['received_at'],
                'payment_status' => 'unpaid',
                'notes'          => $data['notes'] ?? null,
                'total_amount'   => 0,
            ]);

            $total = 0;
            $user = User::findOrFail($receivedBy);
            $versioningService = app(StockVersioningService::class);

            foreach ($data['items'] as $itemData) {
                $targetItem = StockItem::findOrFail($itemData['stock_item_id']);

                // Ensure unit price is passed to GrnItem
                $unitPrice = isset($itemData['unit_price']) ? (int)$itemData['unit_price'] : $targetItem->unit_price;

                $item = GrnItem::create([
                    'grn_header_id' => $grn->id,
                    'stock_item_id' => $targetItem->id,
                    'ordered_qty'   => $itemData['ordered_qty'],
                    'received_qty'  => $itemData['received_qty'],
                    'unit_cost'     => $itemData['unit_cost'],
                    'unit_price'    => $unitPrice,
                ]);

                // Run versioning resolution
                $result = $versioningService->resolveGrnItem($item, $user);

                if ($result['decision'] === 'new_version_created') {
                    // Dispatch notification
                    NotifyNewStockVersion::dispatch(
                        $result['previous_version'],
                        $result['stock_item'],
                        $grn
                    );
                }

                $total += $item->line_total;
            }

            $grn->update(['total_amount' => $total]);

            return $grn->load(['supplier', 'items.stockItem', 'receivedBy']);
        });
    }

    public function addPayment(GrnHeader $grn, int $amount, string $method, ?string $reference, string $paidBy): GrnPayment
    {
        return DB::transaction(function () use ($grn, $amount, $method, $reference, $paidBy) {
            $balance = $grn->balance_amount;
            if ($amount > $balance) {
                throw new \InvalidArgumentException("Payment exceeds balance.");
            }

            $payment = GrnPayment::create([
                'grn_header_id' => $grn->id,
                'amount'        => $amount,
                'payment_method' => $method,
                'reference_no'  => $reference,
                'paid_at'       => now(),
                'paid_by'       => $paidBy,
            ]);

            $paidTotal = $grn->payments()->sum('amount');
            $status    = $paidTotal >= $grn->total_amount ? 'paid' : ($paidTotal > 0 ? 'partial' : 'unpaid');
            $grn->update(['payment_status' => $status]);

            // Add payment to unified expense_entries ledger
            app(\App\Services\ExpenseLedgerService::class)->record(
                $payment->amount,
                'grn',
                'grn_payments',
                $payment->id,
                "GRN payment: {$grn->grn_no}",
                $paidBy,
                now()
            );

            return $payment;
        });
    }
}
