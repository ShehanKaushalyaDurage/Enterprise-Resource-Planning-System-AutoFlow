<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_sale_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_sale_invoice_id')->constrained('stock_sale_invoices')->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer']);
            $table->string('reference_no')->nullable();
            $table->timestamp('paid_at');
            $table->foreignUuid('collected_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_sale_payments');
    }
};
