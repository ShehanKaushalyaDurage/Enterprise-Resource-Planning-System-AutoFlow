<?php

namespace App\Services;

use App\Models\StockSaleInvoice;
use App\Models\StockSaleInvoiceItem;
use App\Models\StockItem;
use Illuminate\Support\Facades\DB;

class StockSaleService
{
    public function __construct(private readonly StockService $stockService)
    {}

    public function generateInvoiceNo(): string
    {
        $year = now()->year;
        $prefix = "STK-INV-{$year}-";
        $last = StockSaleInvoice::where('invoice_no', 'like', "{$prefix}%")
            ->orderBy('invoice_no', 'desc')
            ->first();

        if ($last && preg_match('/STK-INV-\d+-(\d+)$/', $last->invoice_no, $matches)) {
            $nextSeq = (int)$matches[1] + 1;
        } else {
            $nextSeq = 1;
        }

        return "{$prefix}" . str_pad($nextSeq, 5, '0', STR_PAD_LEFT);
    }

    public function createSale(array $data, string $soldBy): StockSaleInvoice
    {
        return DB::transaction(function () use ($data, $soldBy) {
            // Check inventory first
            foreach ($data['items'] as $itemData) {
                $stockItem = StockItem::findOrFail($itemData['stock_item_id']);
                if ($stockItem->current_qty < $itemData['quantity']) {
                    throw new \InvalidArgumentException("Insufficient stock for {$stockItem->name} (Code: {$stockItem->item_code})");
                }
            }

            // Validate tendered amount against total
            $tendered = (int)($data['tendered_amount'] ?? 0);
            $total = (int)$data['total_amount'];

            if ($data['payment_method'] === 'cash') {
                if ($tendered < $total) {
                    throw new \InvalidArgumentException("Tendered amount must be greater than or equal to the total.");
                }
            } else {
                // If card or bank transfer, tendered is exactly total
                $tendered = $total;
            }

            $change = max(0, $tendered - $total);

            // Create Invoice
            $invoice = StockSaleInvoice::create([
                'invoice_no'       => $this->generateInvoiceNo(),
                'customer_name'    => $data['customer_name'],
                'customer_contact' => $data['customer_contact'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
                'subtotal'         => $data['subtotal'],
                'discount_amount'  => $data['discount_amount'] ?? 0,
                'tax_amount'       => 0, // system-wide removal
                'total_amount'     => $total,
                'status'           => 'paid',
                'notes'            => $data['notes'] ?? null,
                'sold_by'          => $soldBy,
                'payment_method'   => $data['payment_method'] ?? 'cash',
                'tendered_amount'  => $tendered,
                'change_amount'    => $change,
                'collected_by'     => $soldBy,
                'paid_at'          => now(),
            ]);

            // Create items and adjust stock
            foreach ($data['items'] as $itemData) {
                $stockItem = StockItem::findOrFail($itemData['stock_item_id']);

                StockSaleInvoiceItem::create([
                    'stock_sale_invoice_id' => $invoice->id,
                    'stock_item_id'         => $stockItem->id,
                    'description'           => $stockItem->name,
                    'quantity'              => $itemData['quantity'],
                    'unit_price'            => $itemData['unit_price'],
                    'line_total'            => $itemData['line_total'],
                ]);

                // Deduct stock via StockService->adjust()
                $this->stockService->adjust($stockItem, 'reduction', $itemData['quantity'], "Direct Stock Sale ({$invoice->invoice_no})", $invoice->id, $soldBy);
            }

            // Post to single income ledger
            IncomeLedgerService::record(
                'stock_sale',
                $invoice->id,
                $invoice->invoice_no,
                $invoice->customer_name,
                $invoice->total_amount,
                $invoice->payment_method,
                $soldBy,
                now()->toDateTimeString(),
                'Income from stock sale'
            );

            // Item 9 CRUD logging
            if (class_exists(\App\Services\SystemLogService::class)) {
                \App\Services\SystemLogService::crud(
                    'created',
                    'StockSale',
                    $invoice->id,
                    ['total_amount' => $invoice->total_amount],
                    auth()->user() ?? \App\Models\User::find($soldBy)
                );
            }

            return $invoice->load(['items.stockItem', 'soldBy']);
        });
    }

    public function voidSale(StockSaleInvoice $invoice, string $voidedBy): StockSaleInvoice
    {
        return DB::transaction(function () use ($invoice, $voidedBy) {
            if ($invoice->status === 'voided') {
                throw new \InvalidArgumentException("This sale has already been voided.");
            }

            $invoice->update(['status' => 'voided']);

            // Restore items
            foreach ($invoice->items as $item) {
                $stockItem = StockItem::findOrFail($item->stock_item_id);
                $this->stockService->adjust(
                    $stockItem,
                    'addition',
                    $item->quantity,
                    "Restored due to voided direct sale ({$invoice->invoice_no})",
                    $invoice->id,
                    $voidedBy
                );
            }

            // Reverse single income ledger row by adding a negative entry
            IncomeLedgerService::record(
                'stock_sale',
                $invoice->id,
                $invoice->invoice_no,
                $invoice->customer_name,
                $invoice->total_amount * -1,
                $invoice->payment_method,
                $voidedBy,
                now()->toDateTimeString(),
                'Reversal from voided stock sale'
            );

            // Item 9 CRUD logging
            if (class_exists(\App\Services\SystemLogService::class)) {
                \App\Services\SystemLogService::crud(
                    'voided',
                    'StockSale',
                    $invoice->id,
                    ['total_amount' => $invoice->total_amount],
                    auth()->user()
                );
            }

            return $invoice->load(['items.stockItem', 'soldBy']);
        });
    }
}
