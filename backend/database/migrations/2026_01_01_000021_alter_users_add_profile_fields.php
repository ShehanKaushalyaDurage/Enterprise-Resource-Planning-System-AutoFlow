<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id')->nullable()->unique();
            $table->string('avatar_path')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->date('joined_date')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['employee_id', 'avatar_path', 'date_of_birth', 'joined_date', 'emergency_contact', 'notes']);
        });
    }
};
