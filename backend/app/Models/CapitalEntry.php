<?php

namespace App\Models;

class CapitalEntry extends BaseModel
{
    protected $table = 'capital_entries';

    protected $fillable = [
        'amount',
        'investor_name',
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
