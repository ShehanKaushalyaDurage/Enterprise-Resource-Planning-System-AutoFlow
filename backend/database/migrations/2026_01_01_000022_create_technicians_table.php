<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technicians', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('technician_code')->unique();
            $table->jsonb('specialization')->nullable();
            $table->string('certification')->nullable();
            $table->integer('experience_years')->nullable();
            $table->boolean('is_available')->default(true);
            $table->string('workshop_bay')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technicians');
    }
};
