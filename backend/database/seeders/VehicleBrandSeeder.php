<?php

namespace Database\Seeders;

use App\Models\VehicleBrand;
use Illuminate\Database\Seeder;

class VehicleBrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            'Toyota',
            'Honda',
            'Nissan',
            'Mitsubishi',
            'Suzuki',
            'Mazda',
            'Subaru',
            'Ford',
            'Hyundai',
            'Kia',
            'BMW',
            'Mercedes-Benz',
            'Audi',
            'Volkswagen',
            'Peugeot',
            'Tata',
            'Mahindra',
            'Bajaj',
            'TVS'
        ];

        foreach ($brands as $brand) {
            VehicleBrand::firstOrCreate(['name' => $brand]);
        }

        $this->command->info('Vehicle brands seeded.');
    }
}
