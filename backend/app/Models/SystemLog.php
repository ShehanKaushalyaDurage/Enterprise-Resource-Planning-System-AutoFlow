<?php

namespace App\Models;

class SystemLog extends BaseModel
{
    protected $table = 'system_logs';

    protected $fillable = [
        'id',
        'action',
        'model_type',
        'model_id',
        'payload',
        'recorded_by',
        'recorded_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'recorded_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
