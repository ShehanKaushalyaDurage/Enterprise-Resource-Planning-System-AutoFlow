<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_items', function (Blueprint $table) {
            $table->string('base_code')->nullable();
            $table->integer('version_number')->default(1);
            $table->boolean('is_latest_version')->default(true);
            $table->foreignUuid('parent_item_id')->nullable()->constrained('stock_items')->nullOnDelete();
        });

        // Backfill existing rows
        $items = DB::table('stock_items')->get();
        foreach ($items as $item) {
            if (preg_match('/^(.*)-V(\d+)$/', $item->item_code, $matches)) {
                $baseCode = $matches[1];
                $version = (int)$matches[2];
                DB::table('stock_items')->where('id', $item->id)->update([
                    'base_code' => $baseCode,
                    'version_number' => $version,
                    'is_latest_version' => true,
                ]);
            } else {
                // Suffix missing -V suffix
                $baseCode = $item->item_code;
                $newCode = "{$baseCode}-V1";
                DB::table('stock_items')->where('id', $item->id)->update([
                    'item_code' => $newCode,
                    'base_code' => $baseCode,
                    'version_number' => 1,
                    'is_latest_version' => true,
                ]);
            }
        }

        // Now that all items are backfilled, we can index
        Schema::table('stock_items', function (Blueprint $table) {
            $table->index('base_code');
            $table->index('is_latest_version');
        });
    }

    public function down(): void
    {
        Schema::table('stock_items', function (Blueprint $table) {
            $table->dropIndex(['is_latest_version']);
            $table->dropIndex(['base_code']);
            $table->dropColumn(['parent_item_id', 'is_latest_version', 'version_number', 'base_code']);
        });
    }
};
