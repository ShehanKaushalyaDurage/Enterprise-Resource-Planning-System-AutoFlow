<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GRN {{ $grn->grn_no }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #222; }
        .page { padding: 30px 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0f3460; padding-bottom: 16px; margin-bottom: 20px; }
        .garage-name { font-size: 20px; font-weight: bold; color: #0f3460; }
        h1 { font-size: 24px; color: #0f3460; }
        .info-grid { display: flex; gap: 16px; margin-bottom: 20px; }
        .info-box { flex: 1; padding: 12px; background: #f8f9fa; border-left: 4px solid #0f3460; border-radius: 4px; }
        .info-box h3 { font-size: 10px; text-transform: uppercase; color: #0f3460; margin-bottom: 6px; }
        .info-box p { font-size: 11px; line-height: 1.7; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #0f3460; color: #fff; padding: 9px 8px; font-size: 11px; }
        td { padding: 7px 8px; border-bottom: 1px solid #e9ecef; font-size: 11px; }
        tr:nth-child(even) td { background: #f8f9fa; }
        .text-right { text-align: right; }
        .total-row td { font-weight: bold; background: #e9ecef; }
        .sig-line { display: inline-block; width: 200px; border-top: 1px solid #333; margin-top: 30px; padding-top: 6px; font-size: 10px; color: #666; text-align: center; margin-right: 40px; }
        .footer { margin-top: 20px; border-top: 1px solid #dee2e6; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <div>
            <div class="garage-name">{{ $garageName ?? 'AutoFlow Service Center' }}</div>
            <div style="font-size:10px;color:#777;margin-top:4px;">{{ $garageAddress ?? '' }}</div>
        </div>
        <div style="text-align:right;">
            <h1>GOODS RECEIVED NOTE</h1>
            <div style="font-size:13px;font-weight:bold;">{{ $grn->grn_no }}</div>
            <div style="font-size:11px;color:#555;">Received: {{ $grn->received_at->format('d M Y') }}</div>
            <div style="font-size:11px;">Status: <strong>{{ strtoupper($grn->payment_status) }}</strong></div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>Supplier</h3>
            <p>
                <strong>{{ $grn->supplier->name }}</strong><br>
                {{ $grn->supplier->contact_person ?? '' }}<br>
                {{ $grn->supplier->phone }}<br>
                {{ $grn->supplier->address ?? '' }}
            </p>
        </div>
        <div class="info-box">
            <h3>Received By</h3>
            <p>
                <strong>{{ $grn->receivedBy->name }}</strong><br>
                Date: {{ $grn->received_at->format('d M Y') }}<br>
                @if($grn->notes) Note: {{ $grn->notes }} @endif
            </p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Item Name</th>
                <th class="text-right">Ordered Qty</th>
                <th class="text-right">Received Qty</th>
                <th class="text-right">Unit Cost (LKR)</th>
                <th class="text-right">Line Total (LKR)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($grn->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->stockItem->item_code }}</td>
                <td>{{ $item->stockItem->name }}</td>
                <td class="text-right">{{ $item->ordered_qty }}</td>
                <td class="text-right">{{ $item->received_qty }}</td>
                <td class="text-right">{{ number_format($item->unit_cost / 100, 2) }}</td>
                <td class="text-right">{{ number_format($item->line_total / 100, 2) }}</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="6" class="text-right">TOTAL</td>
                <td class="text-right">LKR {{ number_format($grn->total_amount / 100, 2) }}</td>
            </tr>
        </tbody>
    </table>

    @if($grn->payments->isNotEmpty())
    <h3 style="margin-bottom:8px;font-size:13px;color:#0f3460;">Payment Summary</h3>
    <table>
        <thead>
            <tr><th>Date</th><th>Method</th><th>Reference</th><th>Paid By</th><th class="text-right">Amount (LKR)</th></tr>
        </thead>
        <tbody>
            @foreach($grn->payments as $p)
            <tr>
                <td>{{ $p->paid_at->format('d M Y') }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $p->payment_method)) }}</td>
                <td>{{ $p->reference_no ?? '—' }}</td>
                <td>{{ $p->paidBy->name ?? '—' }}</td>
                <td class="text-right">{{ number_format($p->amount / 100, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div>
        <span class="sig-line">Received By</span>
        <span class="sig-line">Authorised By</span>
    </div>

    <div class="footer">{{ $garageName ?? 'AutoFlow' }} | Generated: {{ now()->format('d M Y H:i') }}</div>
</div>
</body>
</html>
