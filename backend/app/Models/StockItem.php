<?php

namespace App\Models;

class StockItem extends BaseModel
{
    protected $fillable = [
        'item_code',
        'base_code',
        'version_number',
        'is_latest_version',
        'parent_item_id',
        'name',
        'category',
        'unit_of_measure',
        'current_qty',
        'reorder_level',
        'reorder_qty',
        'unit_cost',
        'unit_price',
        'supplier_id',
        'location',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'current_qty' => 'float',
            'reorder_level' => 'float',
            'reorder_qty' => 'float',
            'unit_cost' => 'integer',
            'unit_price' => 'integer',
            'is_active' => 'boolean',
            'is_latest_version' => 'boolean',
            'version_number' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (StockItem $item) {
            // Ensure base_code and version_number are handled on manual addition
            if (!$item->base_code || !$item->version_number) {
                if (preg_match('/^(.*)-V(\d+)$/', $item->item_code, $matches)) {
                    $item->base_code = $matches[1];
                    $item->version_number = (int)$matches[2];
                } else {
                    $item->base_code = $item->item_code;
                    $item->version_number = 1;
                    $item->item_code = "{$item->item_code}-V1";
                }
                $item->is_latest_version = true;
            }
        });
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class)->orderBy('done_at', 'desc');
    }

    public function alerts()
    {
        return $this->hasMany(StockAlert::class);
    }

    public function parent()
    {
        return $this->belongsTo(StockItem::class, 'parent_item_id');
    }

    public function versions()
    {
        return $this->hasMany(StockItem::class, 'base_code', 'base_code')->orderBy('version_number', 'asc');
    }

    public function getStockStatusAttribute(): string
    {
        if ($this->current_qty <= 0) return 'out';
        if ($this->current_qty <= $this->reorder_level) return 'low';
        return 'ok';
    }

    public function isLowStock(): bool
    {
        return $this->current_qty <= $this->reorder_level && $this->current_qty > 0;
    }

    public function isOutOfStock(): bool
    {
        return $this->current_qty <= 0;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
              ->orWhere('item_code', 'ilike', "%{$term}%");
        });
    }
}
