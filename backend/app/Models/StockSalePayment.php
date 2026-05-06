<?php

namespace App\Models;

class StockSalePayment extends BaseModel
{
    protected $table = 'stock_sale_payments';

    protected $fillable = [
        'stock_sale_invoice_id',
        'amount',
        'payment_method',
        'reference_no',
        'paid_at',
        'collected_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function invoice()
    {
        return $this->belongsTo(StockSaleInvoice::class, 'stock_sale_invoice_id');
    }

    public function collectedBy()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
