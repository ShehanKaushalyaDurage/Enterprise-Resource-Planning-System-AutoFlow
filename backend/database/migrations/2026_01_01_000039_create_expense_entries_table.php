<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('amount');
            $table->string('category', 50); // grn | petty_cash | manual
            $table->string('source_type', 50); // grn_payments | petty_cash_entries | general
            $table->uuid('source_id')->nullable();
            $table->text('description');
            $table->uuid('recorded_by');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->foreign('recorded_by')->references('id')->on('users');

            $table->index('category', 'idx_expenses_category');
            $table->index(['source_type', 'source_id'], 'idx_expenses_source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_entries');
    }
};
