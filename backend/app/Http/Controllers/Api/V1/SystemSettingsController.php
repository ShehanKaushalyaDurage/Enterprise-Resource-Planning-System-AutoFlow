<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class SystemSettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Cache::remember('system_settings', 3600, function () {
            return SystemSetting::all();
        });

        $grouped = [];
        foreach ($settings as $s) {
            $value = $s->value;
            
            // Mask or decrypt specific keys if encrypted
            if (in_array($s->key, ['sms_api_key', 'sms_api_secret'])) {
                $value = [
                    'value'  => '••••••••',
                    'is_set' => !empty($s->value),
                ];
            } else {
                $value = match ($s->type) {
                    'integer' => (int) $s->value,
                    'boolean' => filter_var($s->value, FILTER_VALIDATE_BOOLEAN),
                    'json'    => json_decode($s->value, true),
                    default   => $s->value,
                };
            }
            $grouped[$s->group][$s->key] = $value;
        }

        return response()->json(['success' => true, 'data' => $grouped]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        foreach ($data['settings'] as $key => $val) {
            $s = SystemSetting::where('key', $key)->first();
            
            // Do not update encrypted values if the frontend sends the masked dots back
            if (in_array($key, ['sms_api_key', 'sms_api_secret']) && $val === '••••••••') {
                continue;
            }

            if ($s) {
                if (in_array($key, ['sms_api_key', 'sms_api_secret']) && $val) {
                    $val = Crypt::encryptString($val);
                }
                $s->update(['value' => is_array($val) ? json_encode($val) : (string)$val]);
            } else {
                if (in_array($key, ['sms_api_key', 'sms_api_secret']) && $val) {
                    $val = Crypt::encryptString($val);
                }
                SystemSetting::create([
                    'key'   => $key,
                    'value' => is_array($val) ? json_encode($val) : (string)$val,
                    'type'  => is_bool($val) ? 'boolean' : (is_numeric($val) ? 'integer' : 'string'),
                    'group' => in_array($key, ['sms_api_key', 'sms_api_secret', 'notify_on_service_card', 'notify_on_payment', 'notify_on_stock_alert']) ? 'notifications' : 'general',
                ]);
            }

            // Flush specific key cache
            Cache::forget("system_setting_{$key}");
        }

        // Flush all cached settings
        Cache::forget('system_settings');

        return response()->json(['success' => true, 'message' => 'Settings updated successfully.']);
    }
}
