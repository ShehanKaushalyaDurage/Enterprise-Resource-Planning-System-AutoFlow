<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\GrnController;
use App\Http\Controllers\Api\V1\GrnPaymentController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\OwnerController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PettyCashController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ServiceCardController;
use App\Http\Controllers\Api\V1\StockAlertController;
use App\Http\Controllers\Api\V1\StockItemController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\SystemSettingsController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VehicleController;
use Illuminate\Support\Facades\Route;

// ─── Public Auth Routes ───────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    Route::post('/auth/login', [AuthController::class, 'login']);

    // ─── Authenticated Routes ─────────────────────────────────────────────────
    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/user', [AuthController::class, 'user']);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/kpis', [DashboardController::class, 'kpis']);
        Route::get('/dashboard/charts/monthly-revenue-expense', [DashboardController::class, 'monthlyRevenueExpense']);
        Route::get('/dashboard/charts/service-type-breakdown', [DashboardController::class, 'serviceTypeBreakdown']);
        Route::get('/dashboard/charts/daily-collection', [DashboardController::class, 'dailyCollection']);
        Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity']);
        Route::get('/dashboard/top-vehicles', [DashboardController::class, 'topVehicles']);
        Route::get('/dashboard/alerts', [DashboardController::class, 'alerts']);

        // Owners
        Route::apiResource('owners', OwnerController::class);

        // Technicians
        Route::get('technicians', [\App\Http\Controllers\Api\V1\TechnicianController::class, 'index']);
        Route::get('technicians/leaderboard', [\App\Http\Controllers\Api\V1\TechnicianController::class, 'leaderboard']);
        Route::get('technicians/{technician}/progress', [\App\Http\Controllers\Api\V1\TechnicianController::class, 'progress']);
        Route::post('technicians', [\App\Http\Controllers\Api\V1\TechnicianController::class, 'store']);
        Route::get('technicians/{technician}', [\App\Http\Controllers\Api\V1\TechnicianController::class, 'show']);
        Route::put('technicians/{technician}', [\App\Http\Controllers\Api\V1\TechnicianController::class, 'update']);
        Route::patch('technicians/{technician}/toggle-available', [\App\Http\Controllers\Api\V1\TechnicianController::class, 'toggleAvailable']);

        // Vehicles
        Route::apiResource('vehicles', VehicleController::class);
        Route::get('vehicles/{vehicle}/history', [VehicleController::class, 'history']);

        // Vehicle Brands
        Route::apiResource('vehicle-brands', \App\Http\Controllers\Api\V1\VehicleBrandController::class)->except(['show']);

        // Service Types & Oil Types (read-only for UI)
        Route::get('service-types', fn() => response()->json(['success' => true, 'data' => \App\Models\ServiceType::all()]));
        Route::get('oil-types', fn() => response()->json(['success' => true, 'data' => \App\Models\OilType::where('is_active', true)->get()]));

        // Service Templates
        Route::get('service-templates', [\App\Http\Controllers\Api\V1\ServiceTemplateController::class, 'index']);
        Route::get('service-templates/{template}/brands', [\App\Http\Controllers\Api\V1\ServiceTemplateController::class, 'brands']);
        Route::get('service-templates/brands/{brand}/grades', [\App\Http\Controllers\Api\V1\ServiceTemplateController::class, 'grades']);
        Route::get('service-templates/full-service/package-price', [\App\Http\Controllers\Api\V1\ServiceTemplateController::class, 'packagePrice']);
        Route::post('service-templates/full-service/package-price/customise', [\App\Http\Controllers\Api\V1\ServiceTemplateController::class, 'customisePackagePrice']);

        // Service Cards
        Route::apiResource('service-cards', ServiceCardController::class)->except(['destroy']);
        Route::patch('service-cards/{serviceCard}/status', [ServiceCardController::class, 'updateStatus']);

        // Stock Sales
        Route::get('stock-sales', [\App\Http\Controllers\Api\V1\StockSaleController::class, 'index']);
        Route::post('stock-sales', [\App\Http\Controllers\Api\V1\StockSaleController::class, 'store']);
        Route::get('stock-sales/{stockSale}', [\App\Http\Controllers\Api\V1\StockSaleController::class, 'show']);
        Route::patch('stock-sales/{stockSale}/void', [\App\Http\Controllers\Api\V1\StockSaleController::class, 'void']);
        Route::post('stock-sales/{stockSale}/payments', [\App\Http\Controllers\Api\V1\StockSaleController::class, 'addPayment']);

        // Invoices
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::patch('invoices/{invoice}/void', [InvoiceController::class, 'void'])
            ->middleware('role:admin');

        // Payments on Invoices
        Route::post('invoices/{invoice}/payments', [PaymentController::class, 'store'])
            ->middleware('role:admin,manager,cashier');

        // Stock
        Route::get('stock-items', [StockItemController::class, 'index']);
        Route::get('stock-items/{stockItem}', [StockItemController::class, 'show']);
        Route::get('stock-items/{stockItem}/versions', [StockItemController::class, 'versions']);
        Route::post('stock-items', [StockItemController::class, 'store'])
            ->middleware('role:admin,manager');
        Route::put('stock-items/{stockItem}', [StockItemController::class, 'update'])
            ->middleware('role:admin,manager');
        Route::post('stock-items/{stockItem}/adjust', [StockItemController::class, 'adjust'])
            ->middleware('role:admin,manager');

        // Stock Alerts
        Route::get('stock-alerts', [StockAlertController::class, 'index']);
        Route::patch('stock-alerts/{stockAlert}/acknowledge', [StockAlertController::class, 'acknowledge'])
            ->middleware('role:admin,manager');

        // Suppliers
        Route::apiResource('suppliers', SupplierController::class)->except(['destroy']);

        // Finance
        Route::get('finance/summary', [\App\Http\Controllers\Api\V1\FinanceController::class, 'summary']);
        Route::get('finance/transactions', [\App\Http\Controllers\Api\V1\FinanceController::class, 'transactions']);
        Route::post('finance/capital', [\App\Http\Controllers\Api\V1\FinanceController::class, 'storeCapital']);

        // Income Entries
        Route::get('income-entries', [\App\Http\Controllers\Api\V1\IncomeController::class, 'index']);

        // GRN
        Route::middleware('role:admin,manager')->group(function () {
            Route::get('grn', [GrnController::class, 'index']);
            Route::get('grn/summary', [GrnController::class, 'summary']);
            Route::post('grn', [GrnController::class, 'store']);
            Route::get('grn/{grn}', [GrnController::class, 'show']);
            Route::post('grn/{grn}/payments', [GrnPaymentController::class, 'store']);
        });

        // Petty Cash
        Route::middleware('role:admin,manager')->group(function () {
            Route::get('petty-cash/sessions', [PettyCashController::class, 'sessionIndex']);
            Route::get('petty-cash/sessions/today', [PettyCashController::class, 'sessionToday']);
            Route::post('petty-cash/sessions', [PettyCashController::class, 'openSession']);
            Route::get('petty-cash/entries', [PettyCashController::class, 'entryIndex']);
            Route::post('petty-cash/entries', [PettyCashController::class, 'issueEntry']);
        });

        // Reports (PDF download)
        Route::prefix('reports')->group(function () {
            Route::get('service-card/{serviceCard}', [ReportController::class, 'serviceCard']);
            Route::get('invoice/{invoice}', [ReportController::class, 'invoice']);
            Route::get('grn/{grn}', [ReportController::class, 'grn'])->middleware('role:admin,manager');
            Route::get('petty-cash', [ReportController::class, 'pettyCash'])->middleware('role:admin,manager');
            Route::get('financial-summary', [ReportController::class, 'financialSummary'])->middleware('role:admin');
        });

        // Users (Admin only)
        Route::middleware('role:admin')->group(function () {
            Route::apiResource('users', UserController::class)->except(['destroy']);
            Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
            Route::delete('users/{user}', [UserController::class, 'destroy']);
        });

        // System Settings (Admin only)
        Route::middleware('role:admin')->group(function () {
            Route::get('settings', [SystemSettingsController::class, 'index']);
            Route::put('settings', [SystemSettingsController::class, 'update']);
            Route::get('system-logs', [\App\Http\Controllers\Api\V1\SystemLogController::class, 'index']);
        });
    });
});
