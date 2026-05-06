<?php

namespace App\Models;

class ServiceTemplateOilBrand extends BaseModel
{
    protected $table = 'service_template_oil_brands';

    protected $fillable = [
        'service_template_id',
        'brand_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function template()
    {
        return $this->belongsTo(ServiceTemplate::class, 'service_template_id');
    }

    public function grades()
    {
        return $this->hasMany(ServiceTemplateOilGrade::class, 'oil_brand_id');
    }
}
