<?php

namespace App\Models;

class StockSaleInvoice extends BaseModel
{
    protected $table = 'stock_sale_invoices';

    protected $fillable = [
        'invoice_no',
        'customer_name',
        'customer_contact',
        'customer_address',
        'subtotal',
        'discount_amount',
        'total_amount',
        'status',
        'notes',
        'sold_by',
        'payment_method',
        'tendered_amount',
        'change_amount',
        'collected_by',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'discount_amount' => 'integer',
            'total_amount' => 'integer',
            'tendered_amount' => 'integer',
            'change_amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function items()
    {
        return $this->hasMany(StockSaleInvoiceItem::class, 'stock_sale_invoice_id');
    }

    public function collectedBy()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }

    public function soldBy()
    {
        return $this->belongsTo(User::class, 'sold_by');
    }
}
