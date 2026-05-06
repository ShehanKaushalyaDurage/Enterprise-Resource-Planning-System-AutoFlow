<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    public function generateEmployeeId(): string
    {
        $year = now()->year;
        $prefix = "EMP-{$year}";
        $lastUser = User::where('employee_id', 'like', "{$prefix}%")
            ->orderBy('employee_id', 'desc')
            ->first();

        if ($lastUser && preg_match('/EMP-\d+(\d{3})$/', $lastUser->employee_id, $matches)) {
            $nextSeq = (int)$matches[1] + 1;
        } else {
            $nextSeq = 1;
        }

        return "{$prefix}" . str_pad($nextSeq, 3, '0', STR_PAD_LEFT);
    }

    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $data['employee_id'] = $this->generateEmployeeId();
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }
            return User::create($data);
        });
    }

    public function toggleActive(User $user): void
    {
        $user->update(['is_active' => !$user->is_active]);
    }
}
