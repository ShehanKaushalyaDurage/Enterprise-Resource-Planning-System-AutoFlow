import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Settings, ShieldCheck, Sliders, FileText, Bell } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

export default function SystemSettings() {
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('garage')
  const [formData, setFormData] = useState<Record<string, any>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data),
  })

  useEffect(() => {
    if (data) {
      const flattened: Record<string, any> = {}
      Object.keys(data).forEach(group => {
        Object.keys(data[group]).forEach(key => {
          flattened[key] = data[group][key]
        })
      })
      setFormData(flattened)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: any) => api.put('/settings', { settings: payload }),
    onSuccess: () => {
      addToast('success', 'System settings saved successfully.')
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
    onError: () => addToast('error', 'Failed to update system settings.'),
  })

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  const tabs = [
    { id: 'garage', label: 'Garage Profile', icon: <FileText size={16} /> },
    { id: 'invoice', label: 'Invoice & Billing', icon: <Sliders size={16} /> },
    { id: 'alerts', label: 'Stock & Alerts', icon: <ShieldCheck size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'petty_cash', label: 'Petty Cash', icon: <Sliders size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Settings size={16} /> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure system default options, prefixes, and localization</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-block ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left', gap: 10 }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Tab Pane */}
        <form onSubmit={handleSubmit} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, paddingBottom: 12, borderBottom: '1px solid var(--border)', textTransform: 'capitalize' }}>
            {activeTab.replace('_', ' ')} Settings
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeTab === 'garage' && (
              <>
                <div className="field-group">
                  <label className="label">Garage Name</label>
                  <input className="input" value={formData['garage_name'] || ''} onChange={e => handleChange('garage_name', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="label">Garage Address</label>
                  <textarea className="input" style={{ height: 60 }} value={formData['garage_address'] || ''} onChange={e => handleChange('garage_address', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field-group">
                    <label className="label">Primary Phone</label>
                    <input className="input" value={formData['garage_phone'] || ''} onChange={e => handleChange('garage_phone', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="label">Primary Email</label>
                    <input className="input" type="email" value={formData['garage_email'] || ''} onChange={e => handleChange('garage_email', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field-group">
                    <label className="label">TIN Registration No.</label>
                    <input className="input" value={formData['garage_tin_number'] || formData['garage_tin'] || ''} onChange={e => handleChange('garage_tin_number', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="label">Business Registration No.</label>
                    <input className="input" value={formData['garage_reg_number'] || ''} onChange={e => handleChange('garage_reg_number', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'invoice' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field-group">
                    <label className="label">Invoice Prefix</label>
                    <input className="input" value={formData['invoice_prefix'] || ''} onChange={e => handleChange('invoice_prefix', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="label">Service Card Prefix</label>
                    <input className="input" value={formData['service_card_prefix'] || ''} onChange={e => handleChange('service_card_prefix', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field-group">
                    <label className="label">Default Due Period (Days)</label>
                    <input className="input" type="number" value={formData['invoice_due_days'] || ''} onChange={e => handleChange('invoice_due_days', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="label">Currency Symbol</label>
                    <input className="input" value={formData['currency_symbol'] || ''} onChange={e => handleChange('currency_symbol', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'alerts' && (
              <>
                <div className="field-group">
                  <label className="label">Automated Reorder Alerts Email Recipient</label>
                  <input className="input" type="email" value={formData['stock_alert_email'] || formData['alert_email_recipients'] || ''} onChange={e => handleChange('stock_alert_email', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field-group">
                    <label className="label">Notify Admin on Low Stock</label>
                    <select className="select" value={formData['low_stock_notify_admin'] ? '1' : '0'} onChange={e => handleChange('low_stock_notify_admin', e.target.value === '1')}>
                      <option value="1">Enable Alerts</option>
                      <option value="0">Disable Alerts</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="label">Notify Supplier Email</label>
                    <select className="select" value={formData['low_stock_notify_email'] ? '1' : '0'} onChange={e => handleChange('low_stock_notify_email', e.target.value === '1')}>
                      <option value="1">Enable Alerts</option>
                      <option value="0">Disable Alerts</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="field-group">
                  <label className="label">SMS Provider Selector</label>
                  <select className="select" value={formData['sms_provider'] || 'twilio'} onChange={e => handleChange('sms_provider', e.target.value)}>
                    <option value="twilio">Twilio</option>
                    <option value="vonage">Vonage</option>
                    <option value="custom">Custom SMS API</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field-group">
                    <label className="label">SMS API Key {formData['sms_api_key']?.is_set && <span style={{ color: 'var(--success)', fontSize: 11 }}>(Stored)</span>}</label>
                    <input
                      className="input"
                      type="password"
                      placeholder={formData['sms_api_key']?.is_set ? '••••••••' : 'Enter API Key'}
                      value={formData['sms_api_key'] === '••••••••' ? '' : (typeof formData['sms_api_key'] === 'object' ? '' : formData['sms_api_key'] || '')}
                      onChange={e => handleChange('sms_api_key', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label className="label">SMS API Secret {formData['sms_api_secret']?.is_set && <span style={{ color: 'var(--success)', fontSize: 11 }}>(Stored)</span>}</label>
                    <input
                      className="input"
                      type="password"
                      placeholder={formData['sms_api_secret']?.is_set ? '••••••••' : 'Enter API Secret'}
                      value={formData['sms_api_secret'] === '••••••••' ? '' : (typeof formData['sms_api_secret'] === 'object' ? '' : formData['sms_api_secret'] || '')}
                      onChange={e => handleChange('sms_api_secret', e.target.value)}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="label">Per-Event Notifications</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData['notify_on_service_card'] === true || formData['notify_on_service_card'] === '1'} onChange={e => handleChange('notify_on_service_card', e.target.checked)} />
                      Enable SMS on Service Card Registration
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData['notify_on_payment'] === true || formData['notify_on_payment'] === '1'} onChange={e => handleChange('notify_on_payment', e.target.checked)} />
                      Enable SMS on Payment Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData['notify_on_stock_alert'] === true || formData['notify_on_stock_alert'] === '1'} onChange={e => handleChange('notify_on_stock_alert', e.target.checked)} />
                      Enable SMS on Low Stock Alerts
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'petty_cash' && (
              <>
                <div className="field-group">
                  <label className="label">Default Daily Cash Limit (Cents)</label>
                  <input className="input" type="number" value={formData['default_daily_petty_cash_limit'] || formData['daily_petty_cash_limit'] || ''} onChange={e => handleChange('default_daily_petty_cash_limit', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="label">Approval Permissions Needed</label>
                  <select className="select" value={formData['petty_cash_approver_role'] || 'admin'} onChange={e => handleChange('petty_cash_approver_role', e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div className="field-group">
                  <label className="label">Primary System Theme</label>
                  <select className="select" value={formData['system_theme'] || 'system'} onChange={e => handleChange('system_theme', e.target.value)}>
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field-group">
                    <label className="label">Date Display Format</label>
                    <select className="select" value={formData['date_format'] || 'YYYY-MM-DD'} onChange={e => handleChange('date_format', e.target.value)}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="label">Time Display Format</label>
                    <select className="select" value={formData['time_format'] || '24h'} onChange={e => handleChange('time_format', e.target.value)}>
                      <option value="12h">12-Hour Format</option>
                      <option value="24h">24-Hour Format</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              <Save size={16} style={{ marginRight: 6 }} /> Save {activeTab.replace('_', ' ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
