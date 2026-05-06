<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique(); // full_service, body_wash, repair, painting
            $table->string('label');          // human-readable label
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('oil_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');           // semi_synthetic, fully_synthetic, mineral, diesel_grade
            $table->string('brand');
            $table->string('viscosity_grade')->nullable(); // e.g. 10W-40
            $table->unsignedInteger('price_per_liter'); // in cents
            $table->decimal('stock_qty', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oil_types');
        Schema::dropIfExists('service_types');
    }
};
