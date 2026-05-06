<?php

namespace App\Services;

use App\Models\ServiceCard;
use App\Models\StockAlert;
use App\Models\StockItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Adjust stock manually (addition or reduction)
     */
    public function adjust(StockItem $item, string $type, float $qty, string $reason, ?string $reference, string $userId): StockMovement
    {
        return DB::transaction(function () use ($item, $type, $qty, $reason, $reference, $userId) {
            $before = $item->current_qty;
            $isAddition = in_array($type, ['addition', 'grn']);
            $after  = $isAddition ? $before + $qty : $before - $qty;

            if ($after < 0) {
                throw new \InvalidArgumentException("Insufficient stock. Current: {$before}, Reducing: {$qty}");
            }

            $item->update(['current_qty' => $after]);

            $movement = StockMovement::create([
                'stock_item_id'   => $item->id,
                'type'            => $type,
                'quantity'        => $qty,
                'quantity_before' => $before,
                'quantity_after'  => $after,
                'reason'          => $reason,
                'reference'       => $reference,
                'done_by'         => $userId,
                'done_at'         => now(),
            ]);

            $this->checkAlerts($item);

            return $movement;
        });
    }

    /**
     * Add stock from a GRN line item
     */
    public function addFromGrn(StockItem $item, float $qty, string $grnNo, string $userId): void
    {
        $this->adjust($item, 'grn', $qty, "GRN receipt: {$grnNo}", $grnNo, $userId);
    }

    /**
     * Deduct stock for completed service card items
     */
    public function deductForServiceCard(ServiceCard $card): void
    {
        foreach ($card->items as $lineItem) {
            if (!$lineItem->stock_item_id) continue;

            $stockItem = StockItem::find($lineItem->stock_item_id);
            if (!$stockItem) continue;

            $this->adjust(
                $stockItem,
                'service_card',
                $lineItem->quantity,
                "Service card: {$card->card_no}",
                $card->card_no,
                $card->created_by
            );
        }
    }

    /**
     * Check and create/resolve stock alerts after any movement
     */
    public function checkAlerts(StockItem $item): void
    {
        $existingAlert = StockAlert::where('stock_item_id', $item->id)
            ->whereNull('acknowledged_at')
            ->latest()
            ->first();

        if ($item->isOutOfStock()) {
            if (!$existingAlert || $existingAlert->alert_type !== 'out_of_stock') {
                StockAlert::create([
                    'stock_item_id' => $item->id,
                    'alert_type'    => 'out_of_stock',
                    'triggered_at'  => now(),
                ]);
            }
        } elseif ($item->isLowStock()) {
            if (!$existingAlert || $existingAlert->alert_type !== 'low_stock') {
                StockAlert::create([
                    'stock_item_id' => $item->id,
                    'alert_type'    => 'low_stock',
                    'triggered_at'  => now(),
                ]);
            }
        }
    }
}
