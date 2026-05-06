<?php

namespace Database\Seeders;

use App\Models\OilType;
use Illuminate\Database\Seeder;

class OilTypeSeeder extends Seeder
{
    public function run(): void
    {
        $oils = [
            ['name' => 'semi_synthetic',  'brand' => 'Castrol GTX',     'viscosity_grade' => '10W-40', 'price_per_liter' => 135000, 'stock_qty' => 50],
            ['name' => 'fully_synthetic', 'brand' => 'Mobil 1',         'viscosity_grade' => '5W-30',  'price_per_liter' => 220000, 'stock_qty' => 30],
            ['name' => 'mineral',         'brand' => 'Shell Helix HX3', 'viscosity_grade' => '20W-50', 'price_per_liter' => 85000,  'stock_qty' => 80],
            ['name' => 'diesel_grade',    'brand' => 'Caltex Delo',     'viscosity_grade' => '15W-40', 'price_per_liter' => 115000, 'stock_qty' => 60],
        ];

        foreach ($oils as $oil) {
            OilType::updateOrCreate(['name' => $oil['name']], array_merge($oil, ['is_active' => true]));
        }

        $this->command->info('Oil types seeded. (prices in cents: LKR)');
    }
}
