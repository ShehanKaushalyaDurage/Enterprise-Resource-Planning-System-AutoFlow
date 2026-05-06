<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('action', 50);
            $table->string('model_type', 100);
            $table->uuid('model_id');
            $table->jsonb('payload')->nullable();
            $table->uuid('recorded_by');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->foreign('recorded_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
