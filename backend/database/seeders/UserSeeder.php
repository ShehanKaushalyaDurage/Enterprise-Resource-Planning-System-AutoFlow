<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Admin User',       'email' => 'admin@autoflow.test',       'role' => 'admin'],
            ['name' => 'Manager User',      'email' => 'manager@autoflow.test',     'role' => 'manager'],
            ['name' => 'Tech Kamal',        'email' => 'tech@autoflow.test',        'role' => 'technician'],
            ['name' => 'Cashier Nimal',     'email' => 'cashier@autoflow.test',     'role' => 'cashier'],
            ['name' => 'Reception Sithum',  'email' => 'reception@autoflow.test',   'role' => 'receptionist'],
        ];

        foreach ($users as $userData) {
            $user = User::where('email', $userData['email'])->first();
            if (!$user) {
                User::create([
                    'id'        => (string) Str::uuid(),
                    'email'     => $userData['email'],
                    'name'      => $userData['name'],
                    'role'      => $userData['role'],
                    'password'  => Hash::make('password'),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
            }
        }

        $this->command->info('Users seeded. Login: admin@autoflow.test / password');
    }
}
