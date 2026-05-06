<?php

namespace App\Models;

class GrnHeader extends BaseModel
{
    protected $table = 'grn_headers';

    protected $fillable = [
        'grn_no',
        'supplier_id',
        'received_by',
        'received_at',
        'total_amount',
        'payment_status',
        'notes',
    ];

    protected $appends = [
        'paid_amount',
        'balance_amount',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'date',
            'total_amount' => 'integer',
        ];
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items()
    {
        return $this->hasMany(GrnItem::class, 'grn_header_id');
    }

    public function payments()
    {
        return $this->hasMany(GrnPayment::class, 'grn_header_id');
    }

    public function getPaidAmountAttribute(): int
    {
        return $this->payments()->sum('amount');
    }

    public function getBalanceAmountAttribute(): int
    {
        return max(0, $this->total_amount - $this->getPaidAmountAttribute());
    }
}
