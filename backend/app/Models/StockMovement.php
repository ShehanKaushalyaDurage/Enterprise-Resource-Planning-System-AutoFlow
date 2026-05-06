<?php

namespace App\Models;

class StockMovement extends BaseModel
{
    protected $fillable = [
        'stock_item_id',
        'type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'reason',
        'reference',
        'done_by',
        'done_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'quantity_before' => 'float',
            'quantity_after' => 'float',
            'done_at' => 'datetime',
        ];
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class);
    }

    public function doneBy()
    {
        return $this->belongsTo(User::class, 'done_by');
    }
}
