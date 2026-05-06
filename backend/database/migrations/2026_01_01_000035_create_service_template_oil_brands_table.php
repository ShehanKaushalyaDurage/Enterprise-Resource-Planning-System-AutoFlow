<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_template_oil_brands', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('service_template_id');
            $table->string('brand_name', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('service_template_id')->references('id')->on('service_templates')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_template_oil_brands');
    }
};
