<?php

namespace App\Services;

use App\Models\ServiceTemplate;
use App\Models\ServiceTemplateOilGrade;
use App\Models\StockItem;

class ServiceTemplateService
{
    /**
     * Build the 3 standard line items array for a full oil service package.
     */
    public function buildLineItems(ServiceTemplateOilGrade $grade, ?array $customQtys = null): array
    {
        $lineItems = [];

        // 1. Core Oil selection
        $oilItem = $grade->stockItem;
        $oilQty = $customQtys['oil'] ?? $grade->default_qty;
        $lineItems[] = [
            'stock_item_id' => $oilItem->id,
            'description' => "Oil: {$grade->grade_name}",
            'item_type' => 'part',
            'quantity' => $oilQty,
            'unit_price' => $oilItem->unit_price,
            'line_total' => (int) round($oilQty * $oilItem->unit_price),
            'is_package_item' => true,
            'item_role' => 'oil',
        ];

        // 2. Load required items from the brand's template
        $template = $grade->brand->template;
        $requiredItems = $template->requiredItems()->with('stockItem')->get();

        foreach ($requiredItems as $req) {
            $reqItem = $req->stockItem;
            $reqQty = $customQtys[$req->item_role] ?? $req->default_qty;
            $lineItems[] = [
                'stock_item_id' => $reqItem->id,
                'description' => "{$reqItem->name} (Package Item)",
                'item_type' => 'part',
                'quantity' => $reqQty,
                'unit_price' => $reqItem->unit_price,
                'line_total' => (int) round($reqQty * $reqItem->unit_price),
                'is_package_item' => true,
                'item_role' => $req->item_role,
            ];
        }

        return $lineItems;
    }
}
