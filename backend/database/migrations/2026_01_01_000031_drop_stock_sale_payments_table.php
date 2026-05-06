<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('stock_sale_payments');
    }

    public function down(): void
    {
        Schema::create('stock_sale_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_sale_invoice_id');
            $table->integer('amount');
            $table->string('payment_method', 20);
            $table->string('reference_no')->nullable();
            $table->uuid('paid_by');
            $table->timestamp('paid_at');
            $table->timestamps();
        });
    }
};
