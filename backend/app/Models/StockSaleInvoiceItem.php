<?php

namespace App\Models;

class StockSaleInvoiceItem extends BaseModel
{
    protected $table = 'stock_sale_invoice_items';

    protected $fillable = [
        'stock_sale_invoice_id',
        'stock_item_id',
        'description',
        'quantity',
        'unit_price',
        'line_total',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'unit_price' => 'integer',
            'line_total' => 'integer',
        ];
    }

    public function invoice()
    {
        return $this->belongsTo(StockSaleInvoice::class, 'stock_sale_invoice_id');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_item_id');
    }
}
