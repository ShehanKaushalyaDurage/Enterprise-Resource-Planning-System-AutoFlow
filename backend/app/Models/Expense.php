<?php

namespace App\Models;

class Expense extends BaseModel
{
    protected $fillable = [
        'expense_type',
        'reference_id',
        'reference_no',
        'amount',
        'description',
        'expense_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'expense_date' => 'date',
        ];
    }
}
