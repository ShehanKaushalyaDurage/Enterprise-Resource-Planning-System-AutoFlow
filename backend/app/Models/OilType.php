<?php

namespace App\Models;

class OilType extends BaseModel
{
    protected $fillable = [
        'name',
        'brand',
        'viscosity_grade',
        'price_per_liter',
        'stock_qty',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_per_liter' => 'integer',
            'stock_qty' => 'float',
            'is_active' => 'boolean',
        ];
    }

    // price_per_liter in cents → display in currency
    public function getPriceFormattedAttribute(): string
    {
        return number_format($this->price_per_liter / 100, 2);
    }
}
