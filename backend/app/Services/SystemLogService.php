<?php

namespace App\Services;

use App\Models\SystemLog;
use App\Models\User;
use Illuminate\Support\Str;

class SystemLogService
{
    public static function crud(
        string $action,
        string $modelType,
        string $modelId,
        ?array $payload,
        ?User $user = null
    ): void {
        $userId = $user ? $user->id : (auth()->id() ?: User::where('role', 'admin')->first()?->id);
        if (!$userId) {
            return;
        }

        SystemLog::create([
            'id'          => Str::uuid(),
            'action'      => $action,
            'model_type'  => $modelType,
            'model_id'    => $modelId,
            'payload'     => $payload,
            'recorded_by' => $userId,
            'recorded_at' => now(),
        ]);
    }
}
