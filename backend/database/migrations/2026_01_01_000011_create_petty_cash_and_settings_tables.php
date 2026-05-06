<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('session_date')->unique();
            $table->unsignedInteger('daily_limit')->default(0); // cents
            $table->unsignedInteger('total_spent')->default(0); // cents
            $table->foreignUuid('opened_by')->constrained('users');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('petty_cash_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('petty_cash_sessions')->cascadeOnDelete();
            $table->string('reason');
            $table->unsignedInteger('amount'); // cents
            $table->string('issued_to')->nullable();
            $table->foreignUuid('issued_by')->constrained('users');
            $table->timestamp('issued_at');
            $table->string('receipt_no')->nullable();
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('expense_type', ['grn', 'petty_cash', 'other']);
            $table->uuid('reference_id')->nullable(); // polymorphic to grn_header or petty_cash_entry
            $table->string('reference_no')->nullable();
            $table->unsignedInteger('amount'); // cents
            $table->string('description');
            $table->date('expense_date');
            $table->timestamps();

            $table->index('expense_type');
            $table->index('expense_date');
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->string('group')->default('general');
            $table->string('label')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('petty_cash_entries');
        Schema::dropIfExists('petty_cash_sessions');
    }
};
