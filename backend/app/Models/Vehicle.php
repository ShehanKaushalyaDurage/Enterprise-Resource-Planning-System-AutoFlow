<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id',
        'vehicle_no',
        'model',
        'brand_id',
        'category',
        'fuel_type',
        'color',
        'year_of_manufacture',
        'mileage_at_registration',
    ];

    protected function casts(): array
    {
        return [
            'year_of_manufacture' => 'integer',
            'mileage_at_registration' => 'float',
        ];
    }

    // Auto-uppercase vehicle_no
    public function setVehicleNoAttribute(string $value): void
    {
        $this->attributes['vehicle_no'] = strtoupper(trim($value));
    }

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    public function brand()
    {
        return $this->belongsTo(VehicleBrand::class, 'brand_id');
    }

    public function serviceCards()
    {
        return $this->hasMany(ServiceCard::class)->orderBy('created_at', 'desc');
    }

    public function latestServiceCard()
    {
        return $this->hasOne(ServiceCard::class)->latestOfMany();
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where('vehicle_no', 'ilike', "%{$term}%");
    }
}
