<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('income_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source_type', 30); // 'service_invoice' | 'stock_sale'
            $table->uuid('source_id');
            $table->string('source_ref', 50);
            $table->string('customer_name', 150)->nullable();
            $table->integer('amount');
            $table->string('payment_method', 20);
            $table->uuid('collected_by')->nullable();
            $table->timestamp('collected_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('collected_by')->references('id')->on('users')->onDelete('set null');

            $table->index('source_type');
            $table->index('collected_at');
            $table->index('collected_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('income_entries');
    }
};
