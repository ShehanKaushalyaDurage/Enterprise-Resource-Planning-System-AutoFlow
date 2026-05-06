<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedInteger('tax_rate_snapshot')->nullable()->after('tax_amount');
            $table->string('tax_label_snapshot')->nullable()->after('tax_rate_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['tax_rate_snapshot', 'tax_label_snapshot']);
        });
    }
};
