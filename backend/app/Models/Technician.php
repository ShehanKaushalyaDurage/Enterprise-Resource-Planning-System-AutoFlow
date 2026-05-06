<?php

namespace App\Models;

class Technician extends BaseModel
{
    protected $table = 'technicians';

    protected $fillable = [
        'user_id',
        'technician_code',
        'specialization',
        'certification',
        'experience_years',
        'is_available',
        'workshop_bay',
    ];

    protected function casts(): array
    {
        return [
            'specialization' => 'array',
            'is_available' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
