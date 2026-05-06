<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_card_items', function (Blueprint $table) {
            $table->boolean('is_package_item')->default(false);
            $table->string('item_role', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('service_card_items', function (Blueprint $table) {
            $table->dropColumn(['is_package_item', 'item_role']);
        });
    }
};
