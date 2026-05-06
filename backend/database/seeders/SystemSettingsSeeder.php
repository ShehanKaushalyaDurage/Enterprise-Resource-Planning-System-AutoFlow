<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Garage Info
            ['key' => 'garage_name',         'value' => 'AutoFlow Service Center', 'type' => 'string',  'group' => 'garage',   'label' => 'Garage Name'],
            ['key' => 'garage_address',      'value' => '123 Main Street, Colombo 03', 'type' => 'string', 'group' => 'garage', 'label' => 'Address'],
            ['key' => 'garage_phone',        'value' => '+94 11 234 5678',         'type' => 'string',  'group' => 'garage',   'label' => 'Phone'],
            ['key' => 'garage_email',        'value' => 'info@autoflow.test',      'type' => 'string',  'group' => 'garage',   'label' => 'Email'],
            ['key' => 'garage_tin',          'value' => 'TIN123456789',            'type' => 'string',  'group' => 'garage',   'label' => 'TIN Number'],
            ['key' => 'garage_tin_number',   'value' => 'TIN123456789',            'type' => 'string',  'group' => 'garage',   'label' => 'TIN Number'],
            ['key' => 'garage_reg_number',   'value' => 'REG987654321',            'type' => 'string',  'group' => 'garage',   'label' => 'Reg Number'],
            ['key' => 'garage_logo_path',    'value' => '',                        'type' => 'string',  'group' => 'garage',   'label' => 'Garage Logo'],

            // Tax & Billing
            ['key' => 'tax_enabled',         'value' => '1',                       'type' => 'boolean', 'group' => 'invoice',  'label' => 'Enable Tax'],
            ['key' => 'tax_rate_percent',    'value' => '8.00',                    'type' => 'string',  'group' => 'invoice',  'label' => 'Tax Rate %'],
            ['key' => 'tax_rate',            'value' => '800',                     'type' => 'integer', 'group' => 'invoice',  'label' => 'Tax Rate Basis Points'],
            ['key' => 'tax_label',           'value' => 'GST',                     'type' => 'string',  'group' => 'invoice',  'label' => 'Tax Label (GST/VAT)'],
            ['key' => 'invoice_due_days',    'value' => '30',                      'type' => 'integer', 'group' => 'invoice',  'label' => 'Invoice Due Days'],
            ['key' => 'invoice_prefix',      'value' => 'INV',                     'type' => 'string',  'group' => 'invoice',  'label' => 'Invoice Prefix'],
            ['key' => 'service_card_prefix', 'value' => 'SC',                      'type' => 'string',  'group' => 'invoice',  'label' => 'Service Card Prefix'],
            ['key' => 'grn_prefix',          'value' => 'GRN',                     'type' => 'string',  'group' => 'invoice',  'label' => 'GRN Prefix'],
            ['key' => 'currency_symbol',     'value' => 'Rs.',                     'type' => 'string',  'group' => 'invoice',  'label' => 'Currency Symbol'],
            ['key' => 'currency_code',       'value' => 'LKR',                     'type' => 'string',  'group' => 'invoice',  'label' => 'Currency Code'],

            // Alerts
            ['key' => 'stock_alert_email',      'value' => 'admin@autoflow.test',  'type' => 'string',  'group' => 'alerts',   'label' => 'Stock Alert Recipients'],
            ['key' => 'alert_email_recipients', 'value' => 'admin@autoflow.test',  'type' => 'string',  'group' => 'alerts',   'label' => 'Alert Email Recipients'],
            ['key' => 'low_stock_notify_admin', 'value' => '1',                    'type' => 'boolean', 'group' => 'alerts',   'label' => 'Notify Admin'],
            ['key' => 'low_stock_notify_email', 'value' => '1',                    'type' => 'boolean', 'group' => 'alerts',   'label' => 'Notify Email'],

            // Petty Cash
            ['key' => 'default_daily_petty_cash_limit', 'value' => '500000',       'type' => 'integer', 'group' => 'petty_cash', 'label' => 'Daily Petty Cash Limit (cents)'],
            ['key' => 'daily_petty_cash_limit', 'value' => '500000',               'type' => 'integer', 'group' => 'petty_cash', 'label' => 'Daily Limit (cents)'],
            ['key' => 'petty_cash_approver_role', 'value' => 'admin',              'type' => 'string',  'group' => 'petty_cash', 'label' => 'Approver Role'],

            // Notification / Appearance
            ['key' => 'system_theme',        'value' => 'system',                  'type' => 'string',  'group' => 'appearance', 'label' => 'System Theme'],
            ['key' => 'date_format',         'value' => 'YYYY-MM-DD',              'type' => 'string',  'group' => 'appearance', 'label' => 'Date Format'],
            ['key' => 'time_format',         'value' => '24h',                     'type' => 'string',  'group' => 'appearance', 'label' => 'Time Format'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        $this->command->info('Updated system settings seeded.');
    }
}
