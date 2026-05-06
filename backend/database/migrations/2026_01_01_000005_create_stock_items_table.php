<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('item_code')->unique();
            $table->string('name');
            $table->string('category');
            $table->enum('unit_of_measure', ['pcs', 'liters', 'kg', 'meters'])->default('pcs');
            $table->decimal('current_qty', 10, 2)->default(0);
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->decimal('reorder_qty', 10, 2)->default(0);
            $table->unsignedInteger('unit_cost')->default(0);  // cents
            $table->unsignedInteger('unit_price')->default(0); // cents
            $table->foreignUuid('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('item_code');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_items');
    }
};
