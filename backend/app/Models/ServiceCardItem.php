<?php

namespace App\Models;

class ServiceCardItem extends BaseModel
{
    protected $fillable = [
        'service_card_id',
        'description',
        'item_type',
        'quantity',
        'unit_price',
        'line_total',
        'stock_item_id',
        'is_package_item',
        'item_role',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'unit_price' => 'integer',
            'line_total' => 'integer',
            'is_package_item' => 'boolean',
        ];
    }

    // Auto-compute line_total before saving
    protected static function booted(): void
    {
        static::saving(function (ServiceCardItem $item) {
            $item->line_total = (int) round($item->quantity * $item->unit_price);
        });
    }

    public function serviceCard()
    {
        return $this->belongsTo(ServiceCard::class);
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class);
    }
}
