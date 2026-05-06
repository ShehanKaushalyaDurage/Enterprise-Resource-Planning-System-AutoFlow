<?php

namespace App\Models;

use Illuminate\Support\Facades\Cache;

class SystemSetting extends BaseModel
{
    protected $table = 'system_settings';

    protected $fillable = ['key', 'value', 'type', 'group', 'label'];

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("system_setting_{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            if (!$setting) return $default;

            return match ($setting->type) {
                'integer' => (int) $setting->value,
                'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
                'json'    => json_decode($setting->value, true),
                default   => $setting->value,
            };
        });
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => is_array($value) ? json_encode($value) : (string) $value]
        );
        Cache::forget("system_setting_{$key}");
        Cache::forget('system_settings');
    }
}
