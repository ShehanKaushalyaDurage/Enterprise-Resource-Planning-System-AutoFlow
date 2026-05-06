<?php

namespace App\Models;

class ServiceTemplateOilGrade extends BaseModel
{
    protected $table = 'service_template_oil_grades';

    protected $fillable = [
        'oil_brand_id',
        'grade_name',
        'stock_item_id',
        'default_qty',
        'is_active',
    ];

    protected $casts = [
        'default_qty' => 'float',
        'is_active' => 'boolean',
    ];

    public function brand()
    {
        return $this->belongsTo(ServiceTemplateOilBrand::class, 'oil_brand_id');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_item_id');
    }
}
