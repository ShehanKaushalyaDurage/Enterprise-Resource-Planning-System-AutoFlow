<?php

namespace App\Models;

class ServiceCard extends BaseModel
{
    protected $fillable = [
        'card_no',
        'vehicle_id',
        'owner_id',
        'service_type_id',
        'oil_type_id',
        'oil_quantity_liters',
        'remarks',
        'inspection_notes',
        'status',
        'created_by',
        'technician_id',
        'mileage_at_service',
    ];

    protected function casts(): array
    {
        return [
            'oil_quantity_liters' => 'float',
            'mileage_at_service' => 'float',
        ];
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    public function serviceType()
    {
        return $this->belongsTo(ServiceType::class);
    }

    public function oilType()
    {
        return $this->belongsTo(OilType::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function items()
    {
        return $this->hasMany(ServiceCardItem::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['pending', 'in_progress']);
    }

    public function isFullService(): bool
    {
        return $this->serviceType?->name === 'full_service';
    }
}
