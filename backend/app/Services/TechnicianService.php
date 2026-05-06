<?php

namespace App\Services;

use App\Models\Technician;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TechnicianService
{
    public function __construct(private readonly UserService $userService)
    {}

    public function generateTechnicianCode(): string
    {
        $last = Technician::orderBy('technician_code', 'desc')->first();
        if ($last && preg_match('/TECH-(\d+)$/', $last->technician_code, $matches)) {
            $nextSeq = (int)$matches[1] + 1;
        } else {
            $nextSeq = 1;
        }

        return "TECH-" . str_pad($nextSeq, 3, '0', STR_PAD_LEFT);
    }

    public function createTechnician(array $data): Technician
    {
        return DB::transaction(function () use ($data) {
            // Step 1: create user
            $userData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'role' => 'technician',
                'password' => $data['password'] ?? 'password',
                'joined_date' => $data['joined_date'] ?? now()->toDateString(),
            ];
            $user = $this->userService->createUser($userData);

            // Step 2: create technician profile
            $tech = Technician::create([
                'user_id' => $user->id,
                'technician_code' => $this->generateTechnicianCode(),
                'specialization' => $data['specialization'] ?? [],
                'certification' => $data['certification'] ?? null,
                'experience_years' => $data['experience_years'] ?? null,
                'is_available' => $data['is_available'] ?? true,
                'workshop_bay' => $data['workshop_bay'] ?? null,
            ]);

            return $tech->load('user');
        });
    }
}
