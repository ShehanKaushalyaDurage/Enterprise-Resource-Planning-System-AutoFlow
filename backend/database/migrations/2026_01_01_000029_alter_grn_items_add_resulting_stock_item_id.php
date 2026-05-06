<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grn_items', function (Blueprint $table) {
            $table->foreignUuid('resulting_stock_item_id')->nullable()->constrained('stock_items')->nullOnDelete();
            $table->unsignedInteger('unit_price')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('grn_items', function (Blueprint $table) {
            $table->dropColumn(['resulting_stock_item_id', 'unit_price']);
        });
    }
};
