<?php

namespace App\Services;

use App\Models\ServiceCard;
use App\Models\StockReservation;
use App\Models\StockItem;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockReservationService
{
    /**
     * Reserve stock for a service card if shifting to in_progress status.
     */
    public function reserve(ServiceCard $card): void
    {
        DB::transaction(function () use ($card) {
            // Avoid duplicate active reservations
            $existing = StockReservation::where('service_card_id', $card->id)
                ->where('status', 'active')
                ->exists();

            if ($existing) {
                return;
            }

            // Get line items that are parts or consumables and have a stock_item_id
            $items = $card->items()
                ->whereIn('item_type', ['part', 'consumable'])
                ->whereNotNull('stock_item_id')
                ->get();

            if ($items->isEmpty()) {
                return;
            }

            // Group requested quantities by stock item to accurately check total requested per item
            $requestedQtys = [];
            foreach ($items as $item) {
                if (!isset($requestedQtys[$item->stock_item_id])) {
                    $requestedQtys[$item->stock_item_id] = 0;
                }
                $requestedQtys[$item->stock_item_id] += $item->quantity;
            }

            // Verify sufficiency
            $insufficient = [];
            foreach ($requestedQtys as $stockItemId => $qtyNeeded) {
                $stockItem = StockItem::findOrFail($stockItemId);
                if ($stockItem->current_qty < $qtyNeeded) {
                    $insufficient[] = "{$stockItem->name} (Need: {$qtyNeeded}, Have: {$stockItem->current_qty})";
                }
            }

            if (!empty($insufficient)) {
                throw ValidationException::withMessages([
                    'stock' => ['Insufficient stock for items: ' . implode(', ', $insufficient)]
                ]);
            }

            // Decrement stock and create reservation records
            foreach ($requestedQtys as $stockItemId => $qtyNeeded) {
                $stockItem = StockItem::findOrFail($stockItemId);

                // Decrease stock immediately
                $stockItem->decrement('current_qty', $qtyNeeded);

                // Create reservation
                StockReservation::create([
                    'id' => Str::uuid(),
                    'service_card_id' => $card->id,
                    'stock_item_id' => $stockItemId,
                    'quantity' => $qtyNeeded,
                    'status' => 'active',
                ]);
            }
        });
    }

    /**
     * Release all active reservations when completed.
     */
    public function release(ServiceCard $card): void
    {
        DB::transaction(function () use ($card) {
            StockReservation::where('service_card_id', $card->id)
                ->where('status', 'active')
                ->update(['status' => 'released']);
        });
    }

    /**
     * Cancel and restore stock when cancelled/voided.
     */
    public function cancel(ServiceCard $card): void
    {
        DB::transaction(function () use ($card) {
            $activeReservations = StockReservation::where('service_card_id', $card->id)
                ->where('status', 'active')
                ->get();

            foreach ($activeReservations as $res) {
                $stockItem = StockItem::findOrFail($res->stock_item_id);
                // Return stock back to inventory
                $stockItem->increment('current_qty', $res->quantity);

                // Update reservation status
                $res->update(['status' => 'cancelled']);
            }
        });
    }
}
