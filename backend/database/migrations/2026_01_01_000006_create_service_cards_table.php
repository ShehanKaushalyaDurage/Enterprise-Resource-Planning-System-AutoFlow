<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('card_no')->unique(); // SC-YYYY-XXXXX
            $table->foreignUuid('vehicle_id')->constrained('vehicles');
            $table->foreignUuid('owner_id')->constrained('owners');
            $table->foreignUuid('service_type_id')->constrained('service_types');
            $table->foreignUuid('oil_type_id')->nullable()->constrained('oil_types')->nullOnDelete();
            $table->decimal('oil_quantity_liters', 8, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->text('inspection_notes')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->foreignUuid('created_by')->constrained('users');
            $table->foreignUuid('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('mileage_at_service', 10, 2)->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('card_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_cards');
    }
};
