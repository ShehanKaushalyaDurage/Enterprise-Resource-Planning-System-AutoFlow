<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServiceTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create essential stock items for oil, filter, and plug seal
        $oilId = Str::uuid();
        $filterId = Str::uuid();
        $sealId = Str::uuid();

        // Check if items already exist before inserting
        $existingOil = DB::table('stock_items')->where('item_code', 'OIL-SYN-5W30')->first();
        if ($existingOil) {
            $oilId = $existingOil->id;
        } else {
            DB::table('stock_items')->insert([
                'id' => $oilId,
                'item_code' => 'OIL-SYN-5W30',
                'name' => 'Mobil 1 Full Synthetic 5W-30',
                'category' => 'oil',
                'unit_of_measure' => 'liters',
                'current_qty' => 200,
                'reorder_level' => 20,
                'reorder_qty' => 50,
                'unit_cost' => 1500, // Rs. 15.00
                'unit_price' => 2500, // Rs. 25.00
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $existingFilter = DB::table('stock_items')->where('item_code', 'FILTER-OEM')->first();
        if ($existingFilter) {
            $filterId = $existingFilter->id;
        } else {
            DB::table('stock_items')->insert([
                'id' => $filterId,
                'item_code' => 'FILTER-OEM',
                'name' => 'OEM Oil Filter (All Models)',
                'category' => 'parts',
                'unit_of_measure' => 'pcs',
                'current_qty' => 50,
                'reorder_level' => 10,
                'reorder_qty' => 20,
                'unit_cost' => 1000,
                'unit_price' => 1500,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $existingSeal = DB::table('stock_items')->where('item_code', 'SEAL-DRN')->first();
        if ($existingSeal) {
            $sealId = $existingSeal->id;
        } else {
            DB::table('stock_items')->insert([
                'id' => $sealId,
                'item_code' => 'SEAL-DRN',
                'name' => 'Drain Plug Gasket / Seal',
                'category' => 'parts',
                'unit_of_measure' => 'pcs',
                'current_qty' => 100,
                'reorder_level' => 10,
                'reorder_qty' => 50,
                'unit_cost' => 100,
                'unit_price' => 250,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Insert Service Template
        $templateId = Str::uuid();
        $existingTemplate = DB::table('service_templates')->where('code', 'STD-OIL-SVC')->first();
        if ($existingTemplate) {
            $templateId = $existingTemplate->id;
        } else {
            DB::table('service_templates')->insert([
                'id' => $templateId,
                'name' => 'Standard Full Service Package',
                'code' => 'STD-OIL-SVC',
                'description' => 'Comprehensive oil change including high-grade oil, premium OEM filter, and dynamic inspections.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Insert Brands
        $brandId = Str::uuid();
        $existingBrand = DB::table('service_template_oil_brands')->where('brand_name', 'Mobil')->first();
        if ($existingBrand) {
            $brandId = $existingBrand->id;
        } else {
            DB::table('service_template_oil_brands')->insert([
                'id' => $brandId,
                'service_template_id' => $templateId,
                'brand_name' => 'Mobil',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 4. Insert Grades
        $existingGrade = DB::table('service_template_oil_grades')->where('grade_name', '5W-30 (Full Syn)')->first();
        if (!$existingGrade) {
            DB::table('service_template_oil_grades')->insert([
                'id' => Str::uuid(),
                'oil_brand_id' => $brandId,
                'grade_name' => '5W-30 (Full Syn)',
                'stock_item_id' => $oilId,
                'default_qty' => 4.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 5. Insert Required Items
        $existingReq1 = DB::table('service_template_required_items')
            ->where('service_template_id', $templateId)
            ->where('stock_item_id', $filterId)
            ->first();
        if (!$existingReq1) {
            DB::table('service_template_required_items')->insert([
                'id' => Str::uuid(),
                'service_template_id' => $templateId,
                'stock_item_id' => $filterId,
                'item_role' => 'oil_filter',
                'default_qty' => 1.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $existingReq2 = DB::table('service_template_required_items')
            ->where('service_template_id', $templateId)
            ->where('stock_item_id', $sealId)
            ->first();
        if (!$existingReq2) {
            DB::table('service_template_required_items')->insert([
                'id' => Str::uuid(),
                'service_template_id' => $templateId,
                'stock_item_id' => $sealId,
                'item_role' => 'drain_plug_seal',
                'default_qty' => 1.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
