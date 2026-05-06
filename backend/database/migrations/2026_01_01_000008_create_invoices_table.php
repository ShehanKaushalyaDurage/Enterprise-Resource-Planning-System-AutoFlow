<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_no')->unique(); // INV-YYYY-XXXXX
            $table->foreignUuid('service_card_id')->unique()->constrained('service_cards');
            $table->unsignedInteger('subtotal')->default(0);       // cents
            $table->unsignedInteger('discount_amount')->default(0); // cents
            $table->unsignedInteger('tax_amount')->default(0);      // cents
            $table->unsignedInteger('total_amount')->default(0);    // cents
            $table->unsignedInteger('paid_amount')->default(0);     // cents
            // balance_amount is computed: total_amount - paid_amount
            $table->enum('status', ['unpaid', 'partial', 'paid', 'voided'])->default('unpaid');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('void_reason')->nullable();
            $table->foreignUuid('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('invoice_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
