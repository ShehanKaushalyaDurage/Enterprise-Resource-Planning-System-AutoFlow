<?php

namespace App\Models;

class ServiceTemplateRequiredItem extends BaseModel
{
    protected $table = 'service_template_required_items';

    protected $fillable = [
        'service_template_id',
        'stock_item_id',
        'item_role',
        'default_qty',
        'is_active',
    ];

    protected $casts = [
        'default_qty' => 'float',
        'is_active' => 'boolean',
    ];

    public function template()
    {
        return $this->belongsTo(ServiceTemplate::class, 'service_template_id');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_item_id');
    }
}
