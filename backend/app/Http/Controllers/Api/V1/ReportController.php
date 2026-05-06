<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\GrnHeader;
use App\Models\Invoice;
use App\Models\PettyCashSession;
use App\Models\ServiceCard;
use App\Models\StockItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    public function serviceCard(ServiceCard $serviceCard): Response
    {
        activity('reports')->causedBy(auth()->user())->log("Printed service card {$serviceCard->card_no}");

        $pdf = Pdf::loadView('pdf.service-card', [
            'card' => $serviceCard->load(['vehicle.owner', 'owner', 'serviceType', 'oilType', 'technician', 'items.stockItem', 'invoice']),
        ])->setPaper('a4');

        return $pdf->download("service-card-{$serviceCard->card_no}.pdf");
    }

    public function invoice(Invoice $invoice): Response
    {
        activity('reports')->causedBy(auth()->user())->log("Printed invoice {$invoice->invoice_no}");

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice->load(['serviceCard.vehicle', 'serviceCard.owner', 'serviceCard.items', 'serviceCard.serviceType', 'payments.collectedBy']),
        ])->setPaper('a4');

        return $pdf->download("invoice-{$invoice->invoice_no}.pdf");
    }

    public function grn(GrnHeader $grn): Response
    {
        activity('reports')->causedBy(auth()->user())->log("Printed GRN {$grn->grn_no}");

        $pdf = Pdf::loadView('pdf.grn', [
            'grn' => $grn->load(['supplier', 'receivedBy', 'items.stockItem', 'payments.paidBy']),
        ])->setPaper('a4');

        return $pdf->download("grn-{$grn->grn_no}.pdf");
    }

    public function pettyCash(Request $request): Response
    {
        $data = $request->validate([
            'date'  => ['nullable', 'date'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year'  => ['nullable', 'integer'],
        ]);

        $sessions = PettyCashSession::with(['entries.issuedBy', 'openedBy'])
            ->when($data['date'] ?? null, fn($q) => $q->whereDate('session_date', $data['date']))
            ->when($data['month'] ?? null, fn($q) => $q->whereMonth('session_date', $data['month'])->whereYear('session_date', $data['year'] ?? now()->year))
            ->orderBy('session_date')
            ->get();

        $pdf = Pdf::loadView('pdf.petty-cash', ['sessions' => $sessions])->setPaper('a4');

        return $pdf->download('petty-cash-report.pdf');
    }

    public function financialSummary(Request $request): Response
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        $totalRevenue  = \App\Models\Payment::whereMonth('paid_at', $month)->whereYear('paid_at', $year)->sum('amount');
        $totalExpenses = Expense::whereMonth('expense_date', $month)->whereYear('expense_date', $year)->sum('amount');
        $netProfit     = $totalRevenue - $totalExpenses;

        $topServices = ServiceCard::with('serviceType')
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->get()
            ->groupBy('serviceType.label')
            ->map(fn($cards) => ['count' => $cards->count(), 'revenue' => $cards->sum(fn($c) => $c->invoice?->paid_amount ?? 0)])
            ->sortByDesc('revenue')
            ->take(5);

        $stockValue = StockItem::active()->get()->sum(fn($i) => $i->current_qty * $i->unit_cost);

        $pdf = Pdf::loadView('pdf.financial-summary', compact('totalRevenue', 'totalExpenses', 'netProfit', 'topServices', 'stockValue', 'month', 'year'))->setPaper('a4');

        return $pdf->download("financial-summary-{$year}-{$month}.pdf");
    }
}
