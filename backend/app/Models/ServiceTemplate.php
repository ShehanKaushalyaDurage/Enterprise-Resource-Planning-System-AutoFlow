<?php

namespace App\Models;

class ServiceTemplate extends BaseModel
{
    protected $table = 'service_templates';

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function brands()
    {
        return $this->hasMany(ServiceTemplateOilBrand::class, 'service_template_id');
    }

    public function requiredItems()
    {
        return $this->hasMany(ServiceTemplateRequiredItem::class, 'service_template_id');
    }
}
