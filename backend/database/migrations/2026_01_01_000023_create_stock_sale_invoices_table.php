<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_sale_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_no')->unique();
            $table->string('customer_name');
            $table->string('customer_contact')->nullable();
            $table->string('customer_address')->nullable();
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('discount_amount')->default(0);
            $table->unsignedInteger('tax_amount')->default(0);
            $table->unsignedInteger('total_amount');
            $table->unsignedInteger('paid_amount')->default(0);
            $table->enum('status', ['unpaid', 'partial', 'paid', 'voided'])->default('unpaid');
            $table->text('notes')->nullable();
            $table->foreignUuid('sold_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_sale_invoices');
    }
};
