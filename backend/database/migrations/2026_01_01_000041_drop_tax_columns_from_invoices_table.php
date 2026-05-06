<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'tax_amount')) {
                $table->dropColumn('tax_amount');
            }
            if (Schema::hasColumn('invoices', 'tax_rate_snapshot')) {
                $table->dropColumn('tax_rate_snapshot');
            }
            if (Schema::hasColumn('invoices', 'tax_label_snapshot')) {
                $table->dropColumn('tax_label_snapshot');
            }
        });

        Schema::table('stock_sale_invoices', function (Blueprint $table) {
            if (Schema::hasColumn('stock_sale_invoices', 'tax_amount')) {
                $table->dropColumn('tax_amount');
            }
        });
    }

    public function down(): void
    {
        // Do nothing on down to ensure decommissioning is locked.
    }
};
