<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('owner_id')->constrained('owners')->cascadeOnDelete();
            $table->string('vehicle_no')->unique();
            $table->string('model');
            $table->foreignUuid('brand_id')->constrained('vehicle_brands')->restrictOnDelete();
            $table->enum('category', ['car', 'van', 'bike', 'truck', 'bus']);
            $table->enum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid']);
            $table->string('color');
            $table->smallInteger('year_of_manufacture')->nullable();
            $table->decimal('mileage_at_registration', 10, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('vehicle_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
