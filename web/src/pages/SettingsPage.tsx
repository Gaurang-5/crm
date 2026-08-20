import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { api } from '../api/client';

export function SettingsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'automations' | 'templates'>('profile');

  // Coach Settings
  const [zoomLink, setZoomLink] = useState('https://zoom.us/j/community');
  const [sessionTime, setSessionTime] = useState('7:30 AM - 8:30 AM Daily');
  const [clubCode, setClubCode] = useState('WELLNESS101');
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettingsData = () => {
    setLoading(true);
    Promise.all([
      api.getPlans(),
      api.getProducts(),
      api.getAutomationRules(),
      api.getTemplates(),
      api.getSettings(),
    ])
      .then(([plansData, prodsData, rulesData, tplsData, settingsData]) => {
        setPlans(plansData);
        setProducts(prodsData);
        setRules(rulesData);
        setTemplates(tplsData);
        if (settingsData.settings) {
          if (settingsData.settings.zoom_link) setZoomLink(settingsData.settings.zoom_link);
          if (settingsData.settings.session_time) setSessionTime(settingsData.settings.session_time);
          if (settingsData.settings.club_code) setClubCode(settingsData.settings.club_code);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleSaveCoachSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateSetting('zoom_link', zoomLink);
      await api.updateSetting('session_time', sessionTime);
      await api.updateSetting('club_code', clubCode);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleRuleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      await api.updateAutomationRule(ruleId, { is_active: !currentActive });
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to update rule');
    }
  };

  const handleToggleRuleApproval = async (ruleId: string, currentApproval: boolean) => {
    try {
      await api.updateAutomationRule(ruleId, { requires_manual_approval: !currentApproval });
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to update rule approval mode');
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
      <PageHeader title="Operating System Settings" subtitle="Configure coach profile, pricing catalog, WhatsApp automations & message templates" />

      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('profile')}
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
        >
          Coach & Club Profile
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
        >
          Plans & Product Catalog ({plans.length} Plans)
        </button>
        <button
          onClick={() => setActiveTab('automations')}
          className={`tab-btn ${activeTab === 'automations' ? 'active' : ''}`}
        >
          WhatsApp Automation Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
        >
          Message Templates ({templates.length})
        </button>
      </div>

      {/* Tab 1: Coach Profile */}
      {activeTab === 'profile' && (
        <div className="card max-w-2xl space-y-4">
          <h3 className="text-base font-bold text-primary border-b pb-2">Coach Community & Session Settings</h3>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs font-semibold">
               Settings saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveCoachSettings} style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            <div className="form-group">
              <label className="form-label">Morning Club Zoom Meeting Link</label>
              <input
                type="url"
                required
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                className="form-input"
              />
              <p className="text-[11px] text-slate-500">Automatically sent in WhatsApp invites & reminders</p>
            </div>

            <div className="form-group">
              <label className="form-label">Live Session Timing</label>
              <input
                type="text"
                required
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Club Code</label>
              <input
                type="text"
                required
                value={clubCode}
                onChange={(e) => setClubCode(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingSettings} className="btn btn-primary">
                {savingSettings ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Plans and Products */}
      {activeTab === 'plans' && (
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
          <div className="card" style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            <h3 className="text-subheading border-b pb-2">Membership Plans & Pricing Margins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((p) => (
                <div key={p.code} className="p-4 border rounded-lg space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-primary text-base">{p.name}</h4>
                    <span className="badge badge-success">₹{Number(p.price).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-slate-600">{p.description}</p>
                  <div className="pt-2 border-t text-xs space-y-1 text-slate-700">
                    <p>• Coach Payout Amount: <strong>₹{Number(p.coach_amount).toLocaleString('en-IN')}</strong></p>
                    <p>• Cost of Kit (New Member): <strong>₹{Number(p.cost_of_kit_new).toLocaleString('en-IN')}</strong></p>
                    <p>• Cost of Kit (Renewal): <strong>₹{Number(p.cost_of_kit_renewal).toLocaleString('en-IN')}</strong></p>
                    <p className="text-emerald-700 font-bold">
                      • Net Cash Profit: ₹{(p.coach_amount - p.cost_of_kit_new).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            <h3 className="text-subheading border-b pb-2">Nutrition Products Catalog</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Retail Price</th>
                    <th>Unit Cost</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td className="font-bold text-xs">{prod.code}</td>
                      <td className="font-medium text-xs">{prod.name}</td>
                      <td><span className="badge badge-neutral">{prod.category}</span></td>
                      <td className="font-semibold text-xs">₹{Number(prod.sales_price).toLocaleString('en-IN')}</td>
                      <td className="text-xs text-rose-600">₹{Number(prod.unit_cost).toLocaleString('en-IN')}</td>
                      <td className="text-xs font-bold text-emerald-800">
                        ₹{(prod.sales_price - prod.unit_cost).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Automation Rules */}
      {activeTab === 'automations' && (
        <div className="card" style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="text-subheading">Configurable Automation Engine Rules</h3>
              <p className="text-caption">Idempotent triggers, quiet-hours safety, and manual approval gates</p>
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rule.is_active ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{rule.name}</span>
                    <span className="badge badge-info text-[10px]">{rule.trigger_event}</span>
                  </div>
                  <p className="text-caption mt-1">
                    Action: {rule.action_type} • Delay: {rule.delay_minutes} mins • Template: {rule.template_id || 'Direct'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.requires_manual_approval}
                      onChange={() => handleToggleRuleApproval(rule.id, rule.requires_manual_approval)}
                      className="w-4 h-4 rounded text-green-600"
                    />
                    Require Coach Approval
                  </label>

                  <button
                    onClick={() => handleToggleRuleActive(rule.id, rule.is_active)}
                    className={`btn btn-sm ${rule.is_active ? 'btn-danger' : 'btn-primary'}`}
                  >
                    {rule.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Message Templates */}
      {activeTab === 'templates' && (
        <div className="card" style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
          <h3 className="text-subheading border-b pb-2">Approved WhatsApp Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-4 border rounded-lg space-y-2 bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary text-sm">{tpl.name}</span>
                  <span className="badge badge-neutral text-[10px]">{tpl.category}</span>
                </div>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border font-mono whitespace-pre-wrap">
                  {tpl.body_template}
                </p>
                <p className="text-[11px] text-slate-500">
                  Variables: <strong>{tpl.required_variables?.join(', ') || 'none'}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
