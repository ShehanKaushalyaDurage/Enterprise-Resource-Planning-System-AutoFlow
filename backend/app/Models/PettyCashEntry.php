<?php

namespace App\Models;

class PettyCashEntry extends BaseModel
{
    protected $table = 'petty_cash_entries';

    protected $fillable = [
        'session_id',
        'reason',
        'amount',
        'issued_to',
        'issued_by',
        'issued_at',
        'receipt_no',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'issued_at' => 'datetime',
        ];
    }

    public function session()
    {
        return $this->belongsTo(PettyCashSession::class, 'session_id');
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
