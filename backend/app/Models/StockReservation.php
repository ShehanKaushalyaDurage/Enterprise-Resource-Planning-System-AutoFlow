<?php

namespace App\Models;

class StockReservation extends BaseModel
{
    protected $table = 'stock_reservations';

    protected $fillable = [
        'service_card_id',
        'stock_item_id',
        'quantity',
        'status',
    ];

    protected $casts = [
        'quantity' => 'float',
    ];

    public function serviceCard()
    {
        return $this->belongsTo(ServiceCard::class, 'service_card_id');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_item_id');
    }
}
