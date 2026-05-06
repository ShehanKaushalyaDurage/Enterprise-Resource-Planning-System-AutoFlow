<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->invoice_no }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a2e; background: #fff; }
        .page { padding: 30px 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f3460; padding-bottom: 20px; margin-bottom: 20px; }
        .garage-name { font-size: 22px; font-weight: bold; color: #0f3460; }
        .garage-info { font-size: 11px; color: #555; margin-top: 4px; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 28px; color: #0f3460; font-weight: bold; }
        .invoice-no { font-size: 13px; color: #333; margin-top: 4px; }
        .invoice-status { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 6px; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-unpaid { background: #f8d7da; color: #721c24; }
        .status-partial { background: #fff3cd; color: #856404; }
        .status-voided { background: #e2e3e5; color: #383d41; }
        .info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
        .info-box { flex: 1; background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #0f3460; }
        .info-box h3 { font-size: 11px; text-transform: uppercase; color: #0f3460; margin-bottom: 6px; letter-spacing: 0.5px; }
        .info-box p { font-size: 11px; color: #333; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #0f3460; color: #fff; padding: 10px 8px; text-align: left; font-size: 11px; }
        td { padding: 8px; border-bottom: 1px solid #e9ecef; font-size: 11px; }
        tr:nth-child(even) td { background: #f8f9fa; }
        .text-right { text-align: right; }
        .totals-table { width: 280px; margin-left: auto; }
        .totals-table td { padding: 5px 8px; }
        .totals-table .total-row td { font-weight: bold; font-size: 14px; background: #0f3460; color: #fff; }
        .payment-section { margin-top: 20px; }
        .payment-section h3 { font-size: 13px; font-weight: bold; color: #0f3460; margin-bottom: 8px; border-bottom: 1px solid #dee2e6; padding-bottom: 4px; }
        .balance-due { margin-top: 16px; padding: 12px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; }
        .balance-due.paid { background: #d4edda; border-color: #28a745; }
        .balance-due h3 { font-size: 14px; color: #333; }
        .watermark { position: fixed; top: 40%; left: 15%; font-size: 80px; color: rgba(40, 167, 69, 0.12); transform: rotate(-30deg); font-weight: bold; z-index: -1; }
        .footer { margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 12px; font-size: 10px; color: #888; text-align: center; }
        .tc { margin-top: 20px; font-size: 10px; color: #666; }
        .tc h4 { font-size: 11px; color: #333; margin-bottom: 4px; }
    </style>
</head>
<body>
<div class="page">
    @if($invoice->status === 'paid')
    <div class="watermark">PAID</div>
    @endif

    {{-- Header --}}
    <div class="header">
        <div>
            <div class="garage-name">{{ $garageName ?? 'AutoFlow Service Center' }}</div>
            <div class="garage-info">
                {{ $garageAddress ?? '123 Main Street, Colombo 03' }}<br>
                Tel: {{ $garagePhone ?? '+94 11 234 5678' }} | Email: {{ $garageEmail ?? 'info@autoflow.test' }}<br>
                @if(!empty($garageTin)) TIN: {{ $garageTin }} @endif
            </div>
        </div>
        <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-no">{{ $invoice->invoice_no }}</div>
            <div>Date: {{ $invoice->created_at->format('d M Y') }}</div>
            @if($invoice->due_date)<div>Due: {{ $invoice->due_date->format('d M Y') }}</div>@endif
            <span class="invoice-status status-{{ $invoice->status }}">{{ strtoupper($invoice->status) }}</span>
        </div>
    </div>

    {{-- Bill To / Vehicle --}}
    <div class="info-grid">
        <div class="info-box">
            <h3>Bill To</h3>
            <p>
                <strong>{{ $invoice->serviceCard->owner->full_name }}</strong><br>
                {{ $invoice->serviceCard->owner->contact_no }}<br>
                @if($invoice->serviceCard->owner->email){{ $invoice->serviceCard->owner->email }}<br>@endif
                {{ $invoice->serviceCard->owner->address }}
            </p>
        </div>
        <div class="info-box">
            <h3>Vehicle</h3>
            <p>
                <strong>{{ $invoice->serviceCard->vehicle->vehicle_no }}</strong><br>
                {{ $invoice->serviceCard->vehicle->brand }} {{ $invoice->serviceCard->vehicle->model }}<br>
                {{ ucfirst($invoice->serviceCard->vehicle->category) }} | {{ ucfirst($invoice->serviceCard->vehicle->fuel_type) }}<br>
                Color: {{ $invoice->serviceCard->vehicle->color }}
            </p>
        </div>
        <div class="info-box">
            <h3>Service Info</h3>
            <p>
                Card No: <strong>{{ $invoice->serviceCard->card_no }}</strong><br>
                Type: {{ $invoice->serviceCard->serviceType->label }}<br>
                Service Date: {{ $invoice->serviceCard->created_at->format('d M Y') }}
            </p>
        </div>
    </div>

    {{-- Line Items --}}
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Type</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->serviceCard->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td>{{ ucfirst($item->item_type) }}</td>
                <td class="text-right">{{ number_format($item->quantity, 2) }}</td>
                <td class="text-right">{{ number_format($item->unit_price / 100, 2) }}</td>
                <td class="text-right">{{ number_format($item->line_total / 100, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Totals --}}
    <table class="totals-table">
        <tr><td>Subtotal</td><td class="text-right">{{ number_format($invoice->subtotal / 100, 2) }}</td></tr>
        @if($invoice->discount_amount > 0)
        <tr><td>Discount</td><td class="text-right">- {{ number_format($invoice->discount_amount / 100, 2) }}</td></tr>
        @endif
        @if($invoice->tax_amount > 0)
        <tr><td>Tax ({{ $taxLabel ?? 'GST' }})</td><td class="text-right">{{ number_format($invoice->tax_amount / 100, 2) }}</td></tr>
        @endif
        <tr class="total-row"><td>TOTAL</td><td class="text-right">LKR {{ number_format($invoice->total_amount / 100, 2) }}</td></tr>
    </table>

    {{-- Payment History --}}
    @if($invoice->payments->isNotEmpty())
    <div class="payment-section">
        <h3>Payment History</h3>
        <table>
            <thead>
                <tr><th>Date</th><th>Method</th><th>Reference</th><th>Collected By</th><th class="text-right">Amount (LKR)</th></tr>
            </thead>
            <tbody>
                @foreach($invoice->payments as $p)
                <tr>
                    <td>{{ $p->paid_at->format('d M Y H:i') }}</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $p->payment_method)) }}</td>
                    <td>{{ $p->reference_no ?? '—' }}</td>
                    <td>{{ $p->collectedBy->name ?? '—' }}</td>
                    <td class="text-right">{{ number_format($p->amount / 100, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Balance / Paid In Full --}}
    <div class="balance-due {{ $invoice->status === 'paid' ? 'paid' : '' }}">
        @if($invoice->status === 'paid')
            <h3>✓ Paid in Full — Thank you!</h3>
        @else
            <h3>Balance Due: LKR {{ number_format($invoice->balance_amount / 100, 2) }}</h3>
        @endif
    </div>

    {{-- T&C --}}
    <div class="tc">
        <h4>Terms & Conditions</h4>
        <p>Payment is due within {{ $invoiceDueDays ?? 30 }} days. All prices are inclusive of applicable taxes unless stated otherwise. Goods once sold are not returnable. Service warranty: 1,000 km or 30 days, whichever comes first.</p>
    </div>

    <div class="footer">
        Generated by AutoFlow Service Center Management System | {{ now()->format('d M Y H:i') }}
    </div>
</div>
</body>
</html>
