<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class Owner extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'full_name',
        'contact_no',
        'email',
        'address',
        'nic_no',
    ];

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }

    public function serviceCards()
    {
        return $this->hasMany(ServiceCard::class);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('full_name', 'ilike', "%{$term}%")
              ->orWhere('contact_no', 'like', "%{$term}%")
              ->orWhere('nic_no', 'like', "%{$term}%");
        });
    }
}
