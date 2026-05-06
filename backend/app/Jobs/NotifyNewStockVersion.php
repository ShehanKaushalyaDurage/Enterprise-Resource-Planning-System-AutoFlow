<?php

namespace App\Jobs;

use App\Models\GrnHeader;
use App\Models\StockItem;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NotifyNewStockVersion implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public StockItem $oldVersion,
        public StockItem $newVersion,
        public GrnHeader $grn
    ) {}

    public function handle(): void
    {
        $subject = "New stock version created: {$this->newVersion->item_code}";
        $body = "A new stock batch was created during GRN {$this->grn->grn_no}.
Product: {$this->newVersion->name}
Old batch: {$this->oldVersion->item_code} · Cost: Rs. " . ($this->oldVersion->unit_cost / 100) . " · Sell: Rs. " . ($this->oldVersion->unit_price / 100) . "
New batch: {$this->newVersion->item_code} · Cost: Rs. " . ($this->newVersion->unit_cost / 100) . " · Sell: Rs. " . ($this->newVersion->unit_price / 100) . "
Qty received: {$this->newVersion->current_qty}
Issued by: {$this->grn->receivedBy->name}
Please review the new selling price if needed.";

        Log::info("NOTIFICATION EMAIL TO ADMIN: [{$subject}]\n{$body}");
    }
}
