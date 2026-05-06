<?php

namespace App\Services;

use App\Models\GrnItem;
use App\Models\StockItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockVersioningService
{
    public function resolveGrnItem(GrnItem $grnItem, User $user): array
    {
        return DB::transaction(function () use ($grnItem, $user) {
            $selectedItem = StockItem::where('id', $grnItem->stock_item_id)->lockForUpdate()->firstOrFail();

            $grnUnitCost = $grnItem->unit_cost;
            // Get unit_price from the grnItem line, with fallback to selected item's unit_price
            $grnUnitPrice = $grnItem->unit_price ?: $selectedItem->unit_price;

            // Always compare against the LATEST version
            $latestVersion = StockItem::where('base_code', $selectedItem->base_code)
                ->where('is_latest_version', true)
                ->lockForUpdate()
                ->first();

            if (!$latestVersion) {
                // Should not happen, but fallback to selected item if not set
                $latestVersion = $selectedItem;
            }

            $pricesMatch = (
                $latestVersion->unit_cost == $grnUnitCost &&
                $latestVersion->unit_price == $grnUnitPrice
            );

            if ($pricesMatch) {
                // Merge into the latest version
                $qtyBefore = $latestVersion->current_qty;
                $latestVersion->increment('current_qty', $grnItem->received_qty);

                $grnItem->update(['resulting_stock_item_id' => $latestVersion->id]);

                StockMovement::create([
                    'stock_item_id'   => $latestVersion->id,
                    'type'            => 'grn',
                    'quantity'        => $grnItem->received_qty,
                    'quantity_before' => $qtyBefore,
                    'quantity_after'  => $latestVersion->current_qty,
                    'reason'          => "GRN receipt: " . $grnItem->grnHeader?->grn_no,
                    'reference'       => $grnItem->grnHeader?->grn_no,
                    'done_by'         => $user->id,
                    'done_at'         => now(),
                ]);

                $this->logDecision([
                    'base_code'           => $selectedItem->base_code,
                    'grn_id'              => $grnItem->grn_header_id,
                    'grn_item_id'         => $grnItem->id,
                    'decision'            => 'merged',
                    'existing_item_id'    => $latestVersion->id,
                    'resulting_item_id'   => $latestVersion->id,
                    'existing_unit_cost'  => $latestVersion->unit_cost,
                    'grn_unit_cost'       => $grnUnitCost,
                    'existing_unit_price' => $latestVersion->unit_price,
                    'grn_unit_price'      => $grnUnitPrice,
                    'qty_received'        => $grnItem->received_qty,
                    'decided_by'          => $user->id,
                ]);

                return [
                    'decision'         => 'merged',
                    'stock_item'       => $latestVersion,
                    'previous_version' => $latestVersion,
                ];
            }

            // Prices do NOT match the latest version. Truly new version.
            $nextVersionNum = $latestVersion->version_number + 1;
            $newItemCode = "{$selectedItem->base_code}-V{$nextVersionNum}";

            // Demote all existing versions
            StockItem::where('base_code', $selectedItem->base_code)
                ->update(['is_latest_version' => false]);

            // Create new version row
            $newItem = StockItem::create([
                'id'                => (string) Str::uuid(),
                'item_code'         => $newItemCode,
                'base_code'         => $selectedItem->base_code,
                'version_number'    => $nextVersionNum,
                'is_latest_version' => true,
                'parent_item_id'    => $selectedItem->parent_item_id ?: $selectedItem->id,
                'name'              => $selectedItem->name,
                'category'          => $selectedItem->category,
                'unit_of_measure'   => $selectedItem->unit_of_measure,
                'reorder_level'     => $selectedItem->reorder_level,
                'reorder_qty'       => $selectedItem->reorder_qty,
                'supplier_id'       => $selectedItem->supplier_id,
                'location'          => $selectedItem->location,
                'unit_cost'         => $grnUnitCost,
                'unit_price'        => $grnUnitPrice,
                'current_qty'       => $grnItem->received_qty,
                'is_active'         => true,
            ]);

            $grnItem->update(['resulting_stock_item_id' => $newItem->id]);

            StockMovement::create([
                'stock_item_id'   => $newItem->id,
                'type'            => 'grn',
                'quantity'        => $grnItem->received_qty,
                'quantity_before' => 0,
                'quantity_after'  => $grnItem->received_qty,
                'reason'          => "GRN receipt (new version): " . $grnItem->grnHeader?->grn_no,
                'reference'       => $grnItem->grnHeader?->grn_no,
                'done_by'         => $user->id,
                'done_at'         => now(),
            ]);

            $this->logDecision([
                'base_code'           => $selectedItem->base_code,
                'grn_id'              => $grnItem->grn_header_id,
                'grn_item_id'         => $grnItem->id,
                'decision'            => 'new_version_created',
                'existing_item_id'    => $latestVersion->id,
                'resulting_item_id'   => $newItem->id,
                'existing_unit_cost'  => $latestVersion->unit_cost,
                'grn_unit_cost'       => $grnUnitCost,
                'existing_unit_price' => $latestVersion->unit_price,
                'grn_unit_price'      => $grnUnitPrice,
                'qty_received'        => $grnItem->received_qty,
                'decided_by'          => $user->id,
            ]);

            return [
                'decision'         => 'new_version_created',
                'stock_item'       => $newItem,
                'previous_version' => $latestVersion,
            ];
        });
    }

    private function logDecision(array $data): void
    {
        DB::table('stock_item_versions_log')->insert(array_merge($data, [
            'id' => (string) Str::uuid(),
            'decided_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }
}
