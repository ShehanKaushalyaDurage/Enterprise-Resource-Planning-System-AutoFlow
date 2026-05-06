<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_template_required_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('service_template_id');
            $table->uuid('stock_item_id');
            $table->string('item_role', 30); // 'oil_filter' | 'drain_plug_seal'
            $table->decimal('default_qty', 8, 2)->default(1.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('service_template_id')->references('id')->on('service_templates')->onDelete('cascade');
            $table->foreign('stock_item_id')->references('id')->on('stock_items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_template_required_items');
    }
};
