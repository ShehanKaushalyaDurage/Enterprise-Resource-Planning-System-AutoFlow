<?php

namespace Database\Seeders;

use App\Models\ServiceType;
use App\Models\OilType;
use Illuminate\Database\Seeder;

class ServiceTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'full_service', 'label' => 'Full Service',  'description' => 'Complete vehicle service including oil change and inspection'],
            ['name' => 'body_wash',    'label' => 'Body Wash',     'description' => 'Exterior and interior vehicle cleaning'],
            ['name' => 'repair',       'label' => 'Repair',        'description' => 'Mechanical or electrical repair work'],
            ['name' => 'painting',     'label' => 'Painting',      'description' => 'Vehicle body painting and touch-up'],
        ];

        foreach ($types as $type) {
            ServiceType::updateOrCreate(['name' => $type['name']], $type);
        }

        $this->command->info('Service types seeded.');
    }
}
