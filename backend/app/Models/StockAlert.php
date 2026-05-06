<?php

namespace App\Models;

class StockAlert extends BaseModel
{
    protected $fillable = [
        'stock_item_id',
        'alert_type',
        'triggered_at',
        'acknowledged_by',
        'acknowledged_at',
    ];

    protected function casts(): array
    {
        return [
            'triggered_at' => 'datetime',
            'acknowledged_at' => 'datetime',
        ];
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class);
    }

    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function isAcknowledged(): bool
    {
        return $this->acknowledged_at !== null;
    }

    public function scopeUnacknowledged($query)
    {
        return $query->whereNull('acknowledged_at');
    }
}
