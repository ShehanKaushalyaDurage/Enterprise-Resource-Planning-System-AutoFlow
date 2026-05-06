<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_template_oil_grades', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('oil_brand_id');
            $table->string('grade_name', 50); // e.g. 5W-30, 10W-40
            $table->uuid('stock_item_id'); // maps to actual inventory item
            $table->decimal('default_qty', 8, 2)->default(4.00); // number of liters
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('oil_brand_id')->references('id')->on('service_template_oil_brands')->onDelete('cascade');
            $table->foreign('stock_item_id')->references('id')->on('stock_items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_template_oil_grades');
    }
};
