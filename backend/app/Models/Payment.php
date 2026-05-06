<?php

namespace App\Models;

class Payment extends BaseModel
{
    protected $fillable = [
        'invoice_id',
        'amount',
        'payment_method',
        'reference_no',
        'paid_at',
        'collected_by',
        'notes',
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
        return $this->belongsTo(Invoice::class);
    }

    public function collectedBy()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
