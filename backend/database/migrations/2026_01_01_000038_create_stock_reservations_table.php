<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('service_card_id');
            $table->uuid('stock_item_id');
            $table->decimal('quantity', 10, 2);
            $table->string('status', 20)->default('active'); // active | released | cancelled
            $table->timestamps();

            $table->foreign('service_card_id')->references('id')->on('service_cards')->onDelete('cascade');
            $table->foreign('stock_item_id')->references('id')->on('stock_items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');
    }
};
