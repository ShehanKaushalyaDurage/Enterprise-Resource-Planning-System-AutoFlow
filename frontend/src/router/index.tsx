import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'

// Pages
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard/Dashboard'
import VehicleList from '@/pages/vehicles/VehicleList'
import VehicleWizard from '@/pages/vehicles/VehicleWizard'
import VehicleHistory from '@/pages/vehicles/VehicleHistory'
import ServiceCardList from '@/pages/service-cards/ServiceCardList'
import ServiceCardCreate from '@/pages/service-cards/ServiceCardCreate'
import ServiceCardDetail from '@/pages/service-cards/ServiceCardDetail'
import InvoiceList from '@/pages/invoices/InvoiceList'
import InvoiceDetail from '@/pages/invoices/InvoiceDetail'
import StockList from '@/pages/stock/StockList'
import StockForm from '@/pages/stock/StockForm'
import StockAlerts from '@/pages/stock/StockAlerts'
import GrnList from '@/pages/grn/GrnList'
import GrnCreate from '@/pages/grn/GrnCreate'
import GrnDetail from '@/pages/grn/GrnDetail'
import PettyCash from '@/pages/petty-cash/PettyCash'
import UserList from '@/pages/users/UserList'
import SystemSettings from '@/pages/settings/SystemSettings'
import VehicleBrandList from '@/pages/settings/VehicleBrandList'
import TechnicianBoard from '@/pages/technician/TechnicianBoard'
import TechnicianList from '@/pages/technician/TechnicianList'
import ServiceTemplates from '@/pages/settings/ServiceTemplates'
import SystemLogs from '@/pages/settings/SystemLogs'

// Phase 2 Stock Sales
import StockSaleList from '@/pages/stock-sales/StockSaleList'
import StockSaleCreate from '@/pages/stock-sales/StockSaleCreate'
import StockSaleDetail from '@/pages/stock-sales/StockSaleDetail'

// Phase 2 Finance
import FinancePanel from '@/pages/finance/FinancePanel'
import Expenses from '@/pages/expenses/Expenses'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },

          // Vehicles
          { path: 'vehicles', element: <VehicleList /> },
          { path: 'vehicles/new', element: <VehicleWizard /> },
          { path: 'vehicles/:id/history', element: <VehicleHistory /> },

          // Service Cards
          { path: 'service-cards', element: <ServiceCardList /> },
          { path: 'service-cards/new', element: <ServiceCardCreate /> },
          { path: 'service-cards/:id', element: <ServiceCardDetail /> },

          // Invoices
          { path: 'invoices', element: <InvoiceList /> },
          { path: 'invoices/:id', element: <InvoiceDetail /> },

          // Stock Sales (Module E)
          { path: 'stock-sales', element: <StockSaleList /> },
          { path: 'stock-sales/new', element: <StockSaleCreate /> },
          { path: 'stock-sales/:id', element: <StockSaleDetail /> },

          // Stock
          { path: 'stock', element: <StockList /> },
          { path: 'stock/new', element: <StockForm /> },
          { path: 'stock/:id/edit', element: <StockForm /> },
          { path: 'stock/alerts', element: <StockAlerts /> },

          // GRN
          { path: 'grn', element: <GrnList /> },
          { path: 'grn/new', element: <GrnCreate /> },
          { path: 'grn/:id', element: <GrnDetail /> },

          // Finance (Module G)
          { path: 'finance', element: <FinancePanel /> },

          // Expenses
          { path: 'expenses', element: <Expenses /> },

          // Petty Cash
          { path: 'petty-cash', element: <PettyCash /> },

          // Technicians (Module D)
          { path: 'technicians', element: <TechnicianList /> },
          { path: 'my-tasks', element: <TechnicianBoard /> },

          // Users (admin only - Module A)
          { path: 'users', element: <UserList /> },

          // Settings
          { path: 'settings', element: <SystemSettings /> },
          { path: 'settings/vehicle-brands', element: <VehicleBrandList /> },
          { path: 'settings/service-templates', element: <ServiceTemplates /> },
          { path: 'settings/system-logs', element: <SystemLogs /> },
        ],
      },
    ],
  },
])
