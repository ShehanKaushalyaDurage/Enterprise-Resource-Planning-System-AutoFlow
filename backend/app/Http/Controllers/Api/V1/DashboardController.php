<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\ServiceCard;
use App\Models\StockItem;
use App\Models\GrnHeader;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\StockAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'message' => 'Dashboard active'
            ]
        ]);
    }

    public function kpis(): JsonResponse
    {
        $today = now()->toDateString();
        $thisMonth = now()->month;
        $thisYear = now()->year;

        // Today's stats
        $revenueToday = Payment::whereDate('paid_at', $today)->sum('amount');
        $newCardsToday = ServiceCard::whereDate('created_at', $today)->count();
        $pendingInvoicesCount = Invoice::whereIn('status', ['unpaid', 'partial'])->count();
        $pendingInvoicesValue = Invoice::whereIn('status', ['unpaid', 'partial'])
            ->selectRaw('SUM(total_amount - paid_amount) as amount')->value('amount') ?? 0;
        $completedToday = ServiceCard::whereDate('completed_at', $today)->count();

        // Month stats
        $revenueMonth = Payment::whereMonth('paid_at', $thisMonth)->whereYear('paid_at', $thisYear)->sum('amount');
        $totalInvoicedMonth = Invoice::whereMonth('created_at', $thisMonth)->whereYear('created_at', $thisYear)->sum('total_amount');
        $expensesMonth = Expense::whereMonth('expense_date', $thisMonth)->whereYear('expense_date', $thisYear)->sum('amount');
        $grnSpendMonth = DB::table('grn_payments')->whereMonth('paid_at', $thisMonth)->whereYear('paid_at', $thisYear)->sum('amount');
        $pettyCashSpendMonth = DB::table('petty_cash_entries')->whereMonth('issued_at', $thisMonth)->whereYear('issued_at', $thisYear)->sum('amount');

        // Service counts by type
        $serviceBreakdown = ServiceCard::join('service_types', 'service_cards.service_type_id', '=', 'service_types.id')
            ->whereMonth('service_cards.created_at', $thisMonth)
            ->whereYear('service_cards.created_at', $thisYear)
            ->groupBy('service_types.label')
            ->selectRaw('service_types.label as label, COUNT(*) as count')
            ->get()
            ->pluck('count', 'label')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'today' => [
                    'revenue_collected'      => (int)$revenueToday,
                    'new_service_cards'      => $newCardsToday,
                    'pending_invoices_count' => $pendingInvoicesCount,
                    'pending_invoices_value' => (int)$pendingInvoicesValue,
                    'completed_services'     => $completedToday,
                ],
                'this_month' => [
                    'revenue_collected' => (int)$revenueMonth,
                    'total_invoiced'    => (int)$totalInvoicedMonth,
                    'total_expenses'    => (int)$expensesMonth,
                    'net_profit'        => (int)($revenueMonth - $expensesMonth),
                    'grn_spend'         => (int)$grnSpendMonth,
                    'petty_cash_spend'  => (int)$pettyCashSpendMonth,
                    'service_count_by_type' => $serviceBreakdown,
                ],
                'stock' => [
                    'low_stock_count'   => StockItem::whereRaw('current_qty <= reorder_level')->count(),
                    'out_of_stock_count'=> StockItem::where('current_qty', '<=', 0)->count(),
                    'total_stock_value' => (int)StockItem::selectRaw('SUM(current_qty * unit_cost) as total')->value('total'),
                ],
                'grn' => [
                    'pending_payment_count' => GrnHeader::where('payment_status', '!=', 'paid')->count(),
                    'pending_payment_value' => (int)GrnHeader::where('payment_status', '!=', 'paid')
                        ->selectRaw('SUM(total_amount - paid_amount) as bal')->value('bal') ?? 0,
                ]
            ]
        ]);
    }

    public function monthlyRevenueExpense(): JsonResponse
    {
        $revenueByMonth = DB::select("
            SELECT TO_CHAR(paid_at, 'YYYY-MM') as month, SUM(amount) as revenue
            FROM payments
            WHERE paid_at >= NOW() - INTERVAL '12 months'
            GROUP BY month ORDER BY month
        ");

        $expensesByMonth = DB::select("
            SELECT TO_CHAR(expense_date, 'YYYY-MM') as month, SUM(amount) as expenses
            FROM expenses
            WHERE expense_date >= NOW() - INTERVAL '12 months'
            GROUP BY month ORDER BY month
        ");

        $combined = [];
        foreach ($revenueByMonth as $r) {
            $combined[$r->month]['month'] = $r->month;
            $combined[$r->month]['revenue'] = (int)$r->revenue;
            $combined[$r->month]['expenses'] = 0;
            $combined[$r->month]['profit'] = (int)$r->revenue;
        }

        foreach ($expensesByMonth as $e) {
            if (!isset($combined[$e->month])) {
                $combined[$e->month]['month'] = $e->month;
                $combined[$e->month]['revenue'] = 0;
            }
            $combined[$e->month]['expenses'] = (int)$e->expenses;
            $combined[$e->month]['profit'] = $combined[$e->month]['revenue'] - (int)$e->expenses;
        }

        return response()->json([
            'success' => true,
            'data' => array_values($combined)
        ]);
    }

    public function serviceTypeBreakdown(): JsonResponse
    {
        $breakdown = ServiceCard::join('service_types', 'service_cards.service_type_id', '=', 'service_types.id')
            ->groupBy('service_types.label')
            ->selectRaw('service_types.label as label, COUNT(*) as count')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $breakdown
        ]);
    }

    public function dailyCollection(): JsonResponse
    {
        $daily = Payment::selectRaw("TO_CHAR(paid_at, 'YYYY-MM-DD') as date, SUM(amount) as amount")
            ->where('paid_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $daily
        ]);
    }

    public function recentActivity(): JsonResponse
    {
        $activity = DB::table('activity_log')
            ->latest()
            ->limit(15)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activity
        ]);
    }

    public function topVehicles(): JsonResponse
    {
        $top = ServiceCard::join('vehicles', 'service_cards.vehicle_id', '=', 'vehicles.id')
            ->groupBy('vehicles.vehicle_no', 'vehicles.brand_id', 'vehicles.model')
            ->selectRaw('vehicles.vehicle_no as vehicle_no, vehicles.model, COUNT(*) as visit_count')
            ->orderByDesc('visit_count')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $top
        ]);
    }

    public function alerts(): JsonResponse
    {
        $lowStock = StockAlert::unacknowledged()->with('stockItem')->latest('triggered_at')->get();
        $unpaidGrn = GrnHeader::where('payment_status', '!=', 'paid')->with('supplier')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => [
                'low_stock' => $lowStock,
                'unpaid_grn' => $unpaidGrn
            ]
        ]);
    }
}
