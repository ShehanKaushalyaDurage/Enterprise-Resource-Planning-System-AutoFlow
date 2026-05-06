<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_sale_invoices', function (Blueprint $table) {
            $table->string('payment_method', 20)->default('cash');
            $table->integer('tendered_amount')->default(0);
            $table->integer('change_amount')->default(0);
            $table->uuid('collected_by')->nullable();
            $table->timestamp('paid_at')->nullable();

            if (Schema::hasColumn('stock_sale_invoices', 'paid_amount')) {
                $table->dropColumn('paid_amount');
            }
            if (Schema::hasColumn('stock_sale_invoices', 'balance_amount')) {
                $table->dropColumn('balance_amount');
            }
        });

        Schema::table('stock_sale_invoices', function (Blueprint $table) {
            $table->foreign('collected_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('stock_sale_invoices', function (Blueprint $table) {
            $table->dropForeign(['collected_by']);
            $table->dropColumn(['payment_method', 'tendered_amount', 'change_amount', 'collected_by', 'paid_at']);
            $table->integer('paid_amount')->default(0);
        });
    }
};
