<?php

namespace App\Models;

class ExpenseEntry extends BaseModel
{
    protected $table = 'expense_entries';

    protected $fillable = [
        'amount',
        'category',
        'source_type',
        'source_id',
        'description',
        'recorded_by',
        'recorded_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'recorded_at' => 'datetime',
    ];

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
