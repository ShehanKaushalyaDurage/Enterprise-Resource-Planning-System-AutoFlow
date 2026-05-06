<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capital_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('amount');
            $table->string('investor_name', 100);
            $table->text('description')->nullable();
            $table->uuid('recorded_by');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->foreign('recorded_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capital_entries');
    }
};
