<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_sale_invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_sale_invoice_id')->constrained('stock_sale_invoices')->cascadeOnDelete();
            $table->foreignUuid('stock_item_id')->constrained('stock_items');
            $table->string('description');
            $table->decimal('quantity', 12, 2);
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('line_total');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_sale_invoice_items');
    }
};
