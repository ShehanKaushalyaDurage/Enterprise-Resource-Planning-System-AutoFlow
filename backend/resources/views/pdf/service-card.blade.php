<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Service Card {{ $card->card_no }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a2e; }
        .page { padding: 30px 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #e94560; padding-bottom: 16px; margin-bottom: 20px; }
        .garage-name { font-size: 20px; font-weight: bold; color: #0f3460; }
        .card-title h1 { font-size: 22px; color: #e94560; text-align: right; }
        .card-no { font-size: 13px; color: #555; text-align: right; margin-top: 4px; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-in_progress { background: #cce5ff; color: #004085; }
        .status-completed { background: #d4edda; color: #155724; }
        .info-section { display: flex; gap: 16px; margin-bottom: 16px; }
        .info-box { flex: 1; padding: 12px; border: 1px solid #dee2e6; border-radius: 6px; background: #f8f9fa; }
        .info-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f3460; margin-bottom: 6px; border-bottom: 1px solid #dee2e6; padding-bottom: 4px; }
        .info-box p { font-size: 11px; line-height: 1.7; }
        .section-title { font-size: 13px; font-weight: bold; color: #0f3460; margin: 16px 0 8px; border-bottom: 2px solid #e94560; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #0f3460; color: #fff; padding: 8px; font-size: 10px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #e9ecef; font-size: 11px; }
        tr:nth-child(even) td { background: #f8f9fa; }
        .text-right { text-align: right; }
        .totals { margin-left: auto; width: 250px; }
        .totals td { padding: 4px 8px; }
        .totals .grand-total td { font-weight: bold; background: #0f3460; color: #fff; }
        .remarks-box { background: #fff8e1; border: 1px solid #ffc107; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 11px; }
        .signatures { display: flex; gap: 40px; margin-top: 30px; }
        .sig-line { flex: 1; border-top: 1px solid #333; padding-top: 6px; font-size: 10px; color: #666; text-align: center; }
        .footer { margin-top: 20px; border-top: 1px solid #dee2e6; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <div>
            <div class="garage-name">{{ $garageName ?? 'AutoFlow Service Center' }}</div>
            <div style="font-size:10px;color:#777;margin-top:4px;">{{ $garageAddress ?? '123 Main Street, Colombo 03' }}<br>Tel: {{ $garagePhone ?? '+94 11 234 5678' }}</div>
        </div>
        <div class="card-title">
            <h1>SERVICE CARD</h1>
            <div class="card-no">{{ $card->card_no }}</div>
            <div style="margin-top:6px;">
                <span class="status-badge status-{{ $card->status }}">{{ strtoupper(str_replace('_', ' ', $card->status)) }}</span>
            </div>
            <div style="font-size:11px;color:#555;margin-top:4px;">Date: {{ $card->created_at->format('d M Y') }}</div>
        </div>
    </div>

    <div class="info-section">
        <div class="info-box">
            <h3>Owner</h3>
            <p>
                <strong>{{ $card->owner->full_name }}</strong><br>
                {{ $card->owner->contact_no }}<br>
                @if($card->owner->nic_no) NIC: {{ $card->owner->nic_no }} @endif
            </p>
        </div>
        <div class="info-box">
            <h3>Vehicle</h3>
            <p>
                <strong>{{ $card->vehicle->vehicle_no }}</strong><br>
                {{ $card->vehicle->brand }} {{ $card->vehicle->model }}<br>
                {{ ucfirst($card->vehicle->category) }} | {{ ucfirst($card->vehicle->fuel_type) }}<br>
                Color: {{ $card->vehicle->color }}
                @if($card->mileage_at_service)<br>Mileage: {{ number_format($card->mileage_at_service) }} km @endif
            </p>
        </div>
        <div class="info-box">
            <h3>Service Details</h3>
            <p>
                Type: <strong>{{ $card->serviceType->label }}</strong><br>
                @if($card->oilType)
                Oil: {{ $card->oilType->brand }} ({{ $card->oilType->viscosity_grade }})<br>
                Oil Qty: {{ $card->oil_quantity_liters }} L<br>
                @endif
                Technician: {{ $card->technician?->name ?? 'Unassigned' }}<br>
                Created By: {{ $card->createdBy->name }}
            </p>
        </div>
    </div>

    @if($card->inspection_notes)
    <div class="section-title">Inspection Notes</div>
    <div class="remarks-box">{{ $card->inspection_notes }}</div>
    @endif

    @if($card->remarks)
    <div class="section-title">Remarks</div>
    <div class="remarks-box">{{ $card->remarks }}</div>
    @endif

    <div class="section-title">Service Items</div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Type</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price (LKR)</th>
                <th class="text-right">Total (LKR)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($card->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td>{{ ucfirst($item->item_type) }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ number_format($item->unit_price / 100, 2) }}</td>
                <td class="text-right">{{ number_format($item->line_total / 100, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($card->invoice)
    <table class="totals">
        <tr><td>Subtotal</td><td class="text-right">{{ number_format($card->invoice->subtotal / 100, 2) }}</td></tr>
        @if($card->invoice->discount_amount > 0)
        <tr><td>Discount</td><td class="text-right">- {{ number_format($card->invoice->discount_amount / 100, 2) }}</td></tr>
        @endif
        @if($card->invoice->tax_amount > 0)
        <tr><td>Tax</td><td class="text-right">{{ number_format($card->invoice->tax_amount / 100, 2) }}</td></tr>
        @endif
        <tr class="grand-total"><td>TOTAL</td><td class="text-right">LKR {{ number_format($card->invoice->total_amount / 100, 2) }}</td></tr>
    </table>
    @endif

    <div class="signatures">
        <div class="sig-line">Customer Signature</div>
        <div class="sig-line">Technician Signature</div>
        <div class="sig-line">Manager Approval</div>
    </div>

    <div class="footer">{{ $garageName ?? 'AutoFlow Service Center' }} | {{ $garageAddress ?? '' }} | Generated: {{ now()->format('d M Y H:i') }}</div>
</div>
</body>
</html>
