<?php

namespace App\Services;

use App\Models\ServiceCard;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Facades\Activity;

class ServiceCardService
{
    public function __construct(private readonly InvoiceService $invoiceService)
    {}

    /**
     * Generate sequential card number: SC-YYYY-XXXXX
     */
    public function generateCardNo(): string
    {
        $year   = now()->year;
        $prefix = "SC-{$year}-";

        $last = ServiceCard::where('card_no', 'like', "{$prefix}%")
            ->orderBy('card_no', 'desc')
            ->value('card_no');

        $seq = $last ? (int) substr($last, -5) + 1 : 1;

        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Create service card + auto-generate invoice in one transaction
     */
    public function create(array $data, string $createdBy): array
    {
        return DB::transaction(function () use ($data, $createdBy) {
            // Compute line totals before creating
            $items = $data['items'] ?? [];
            if (empty($items)) {
                throw new \InvalidArgumentException('At least one line item is required.');
            }

            $card = ServiceCard::create([
                ...$data,
                'card_no'    => $this->generateCardNo(),
                'created_by' => $createdBy,
                'status'     => 'pending',
            ]);

            foreach ($items as $item) {
                $card->items()->create([
                    'description'   => $item['description'],
                    'item_type'     => $item['item_type'],
                    'quantity'      => $item['quantity'],
                    'unit_price'    => $item['unit_price'],
                    'stock_item_id' => $item['stock_item_id'] ?? null,
                ]);
            }

            $invoice = $this->invoiceService->createFromServiceCard($card->load('items'));

            \App\Services\SystemLogService::crud(
                'created',
                'ServiceCard',
                $card->id,
                ['invoice_no' => $invoice->invoice_no, 'card_no' => $card->card_no],
                auth()->user()
            );

            return ['card' => $card->load(['vehicle', 'owner', 'serviceType', 'oilType', 'items', 'invoice']), 'invoice' => $invoice];
        });
    }

    public function update(ServiceCard $card, array $data): array
    {
        return DB::transaction(function () use ($card, $data) {
            $reservationService = app(\App\Services\StockReservationService::class);
            if ($card->status === 'in_progress') {
                $reservationService->cancel($card);
                \App\Models\StockReservation::where('service_card_id', $card->id)
                    ->whereIn('status', ['cancelled', 'active'])
                    ->delete();
            }

            $card->update([
                'remarks' => $data['remarks'] ?? $card->remarks,
                'inspection_notes' => $data['inspection_notes'] ?? $card->inspection_notes,
                'technician_id' => $data['technician_id'] ?? $card->technician_id,
                'mileage_at_service' => $data['mileage_at_service'] ?? $card->mileage_at_service,
                'oil_type_id' => $data['oil_type_id'] ?? $card->oil_type_id,
                'oil_quantity_liters' => $data['oil_quantity_liters'] ?? $card->oil_quantity_liters,
            ]);

            if (isset($data['items'])) {
                $card->items()->delete();

                foreach ($data['items'] as $item) {
                    $card->items()->create([
                        'description'   => $item['description'],
                        'item_type'     => $item['item_type'],
                        'quantity'      => $item['quantity'],
                        'unit_price'    => $item['unit_price'],
                        'stock_item_id' => $item['stock_item_id'] ?? null,
                    ]);
                }
            }

            if ($card->status === 'in_progress') {
                $reservationService->reserve($card);
            }

            $invoice = $card->invoice;
            if ($invoice) {
                $totalCents = $card->items->sum(fn($i) => $i->quantity * $i->unit_price);
                $invoice->update([
                    'subtotal' => $totalCents,
                    'total_amount' => $totalCents,
                ]);
            }

            return ['card' => $card->load(['vehicle', 'owner', 'serviceType', 'oilType', 'items', 'invoice'])];
        });
    }

    /**
     * Update card status with business rule enforcement
     */
    public function updateStatus(ServiceCard $card, string $newStatus, string $userId): void
    {
        $allowed = [
            'pending'     => ['in_progress', 'cancelled'],
            'in_progress' => ['completed', 'cancelled'],
            'completed'   => [],
            'cancelled'   => [],
        ];

        if (!in_array($newStatus, $allowed[$card->status] ?? [])) {
            throw new \InvalidArgumentException("Cannot transition from {$card->status} to {$newStatus}.");
        }

        DB::transaction(function () use ($card, $newStatus, $userId) {
            $reservationService = app(\App\Services\StockReservationService::class);

            if ($newStatus === 'in_progress') {
                $reservationService->reserve($card);
            } elseif ($newStatus === 'completed') {
                $reservationService->release($card);
            } elseif ($newStatus === 'cancelled') {
                $reservationService->cancel($card);
            }

            $card->update(['status' => $newStatus]);

            activity('service_card')
                ->causedBy(auth()->user())
                ->performedOn($card)
                ->log("Service card {$card->card_no} status changed to {$newStatus}");
        });
    }
}
