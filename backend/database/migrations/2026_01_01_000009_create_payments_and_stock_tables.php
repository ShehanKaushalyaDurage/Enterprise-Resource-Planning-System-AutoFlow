<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->unsignedInteger('amount'); // cents
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer']);
            $table->string('reference_no')->nullable();
            $table->timestamp('paid_at');
            $table->foreignUuid('collected_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_item_id')->constrained('stock_items')->cascadeOnDelete();
            $table->enum('alert_type', ['low_stock', 'out_of_stock']);
            $table->timestamp('triggered_at');
            $table->foreignUuid('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_item_id')->constrained('stock_items')->cascadeOnDelete();
            $table->enum('type', ['addition', 'reduction', 'grn', 'service_card']);
            $table->decimal('quantity', 10, 2);
            $table->decimal('quantity_before', 10, 2)->default(0);
            $table->decimal('quantity_after', 10, 2)->default(0);
            $table->string('reason')->nullable();
            $table->string('reference')->nullable();
            $table->foreignUuid('done_by')->constrained('users');
            $table->timestamp('done_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stock_alerts');
        Schema::dropIfExists('payments');
    }
};
