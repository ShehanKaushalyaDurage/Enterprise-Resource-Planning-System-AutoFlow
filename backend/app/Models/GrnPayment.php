<?php

namespace App\Models;

class GrnPayment extends BaseModel
{
    protected $table = 'grn_payments';

    protected $fillable = [
        'grn_header_id',
        'amount',
        'payment_method',
        'reference_no',
        'paid_at',
        'paid_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function grnHeader()
    {
        return $this->belongsTo(GrnHeader::class, 'grn_header_id');
    }

    public function paidBy()
    {
        return $this->belongsTo(User::class, 'paid_by');
    }
}
