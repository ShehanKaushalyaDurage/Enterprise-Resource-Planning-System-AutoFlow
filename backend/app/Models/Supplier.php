<?php

namespace App\Models;

class Supplier extends BaseModel
{
    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function stockItems()
    {
        return $this->hasMany(StockItem::class);
    }

    public function grnHeaders()
    {
        return $this->hasMany(GrnHeader::class);
    }
}
