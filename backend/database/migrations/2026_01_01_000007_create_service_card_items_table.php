<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_card_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_card_id')->constrained('service_cards')->cascadeOnDelete();
            $table->string('description');
            $table->enum('item_type', ['labour', 'part', 'consumable'])->default('part');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->unsignedInteger('unit_price')->default(0); // cents
            $table->unsignedInteger('line_total')->default(0); // cents (computed: qty * unit_price)
            $table->foreignUuid('stock_item_id')->nullable()->constrained('stock_items')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_card_items');
    }
};
