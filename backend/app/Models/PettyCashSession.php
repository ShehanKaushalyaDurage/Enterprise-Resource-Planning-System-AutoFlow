<?php

namespace App\Models;

class PettyCashSession extends BaseModel
{
    protected $table = 'petty_cash_sessions';

    protected $fillable = [
        'session_date',
        'daily_limit',
        'total_spent',
        'opened_by',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'daily_limit' => 'integer',
            'total_spent' => 'integer',
            'closed_at' => 'datetime',
        ];
    }

    public function openedBy()
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function entries()
    {
        return $this->hasMany(PettyCashEntry::class, 'session_id');
    }

    public function getRemainingAttribute(): int
    {
        return max(0, $this->daily_limit - $this->total_spent);
    }

    public function isClosed(): bool
    {
        return $this->closed_at !== null;
    }

    public static function today(): ?self
    {
        return self::whereDate('session_date', today())->first();
    }
}
