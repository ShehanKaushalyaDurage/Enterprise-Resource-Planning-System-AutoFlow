<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grn_headers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('grn_no')->unique(); // GRN-YYYY-XXXXX
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->foreignUuid('received_by')->constrained('users');
            $table->date('received_at');
            $table->unsignedInteger('total_amount')->default(0); // cents
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('payment_status');
        });

        Schema::create('grn_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grn_header_id')->constrained('grn_headers')->cascadeOnDelete();
            $table->foreignUuid('stock_item_id')->constrained('stock_items');
            $table->decimal('ordered_qty', 10, 2)->default(0);
            $table->decimal('received_qty', 10, 2)->default(0);
            $table->unsignedInteger('unit_cost')->default(0);   // cents
            $table->unsignedInteger('line_total')->default(0);  // cents
            $table->timestamps();
        });

        Schema::create('grn_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grn_header_id')->constrained('grn_headers')->cascadeOnDelete();
            $table->unsignedInteger('amount'); // cents
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer']);
            $table->string('reference_no')->nullable();
            $table->timestamp('paid_at');
            $table->foreignUuid('paid_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_payments');
        Schema::dropIfExists('grn_items');
        Schema::dropIfExists('grn_headers');
    }
};
