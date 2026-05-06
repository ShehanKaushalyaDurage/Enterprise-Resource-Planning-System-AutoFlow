<?php

namespace App\Models;

class Invoice extends BaseModel
{
    protected $fillable = [
        'invoice_no',
        'service_card_id',
        'subtotal',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'status',
        'due_date',
        'notes',
        'void_reason',
        'voided_by',
        'voided_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'discount_amount' => 'integer',
            'total_amount' => 'integer',
            'paid_amount' => 'integer',
            'due_date' => 'date',
            'voided_at' => 'datetime',
        ];
    }

    public function getBalanceAmountAttribute(): int
    {
        return max(0, $this->total_amount - $this->paid_amount);
    }

    public function serviceCard()
    {
        return $this->belongsTo(ServiceCard::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class)->orderBy('paid_at');
    }

    public function voidedBy()
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function isVoidable(): bool
    {
        return $this->status !== 'voided';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
