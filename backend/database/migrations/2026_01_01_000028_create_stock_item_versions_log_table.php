<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_item_versions_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('base_code');
            $table->foreignUuid('grn_id')->constrained('grn_headers');
            $table->foreignUuid('grn_item_id')->constrained('grn_items');
            $table->string('decision'); // merged | new_version_created
            $table->foreignUuid('existing_item_id')->nullable()->constrained('stock_items');
            $table->foreignUuid('resulting_item_id')->constrained('stock_items');
            $table->unsignedInteger('existing_unit_cost')->nullable();
            $table->unsignedInteger('grn_unit_cost');
            $table->unsignedInteger('existing_unit_price')->nullable();
            $table->unsignedInteger('grn_unit_price');
            $table->decimal('qty_received', 10, 2);
            $table->timestamp('decided_at');
            $table->foreignUuid('decided_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_item_versions_log');
    }
};
