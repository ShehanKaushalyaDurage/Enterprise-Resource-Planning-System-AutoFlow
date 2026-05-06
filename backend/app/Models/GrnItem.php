<?php

namespace App\Models;

class GrnItem extends BaseModel
{
    protected $table = 'grn_items';

    protected $fillable = [
        'grn_header_id',
        'stock_item_id',
        'ordered_qty',
        'received_qty',
        'unit_cost',
        'unit_price',
        'line_total',
        'resulting_stock_item_id',
    ];

    protected function casts(): array
    {
        return [
            'ordered_qty' => 'float',
            'received_qty' => 'float',
            'unit_cost' => 'integer',
            'unit_price' => 'integer',
            'line_total' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (GrnItem $item) {
            $item->line_total = (int) round($item->received_qty * $item->unit_cost);
        });
    }

    public function grnHeader()
    {
        return $this->belongsTo(GrnHeader::class, 'grn_header_id');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class);
    }

    public function resultingStockItem()
    {
        return $this->belongsTo(StockItem::class, 'resulting_stock_item_id');
    }
}
