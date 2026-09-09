import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './design/tokens.css';
import './design/base.css';
import './design/components.css';
import './design/animations.css';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { TodayPage } from './pages/TodayPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { PipelinePage } from './pages/PipelinePage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { OrdersPaymentsPage } from './pages/OrdersPaymentsPage';
import { RevenueProfitPage } from './pages/RevenueProfitPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BodyAnalysisPage } from './pages/BodyAnalysisPage';
import { ConsumerHomevisitPage } from './pages/ConsumerHomevisitPage';
import { BodyAnalysisReport } from './pages/BodyAnalysisReport';

import { JoinPage } from './pages/JoinPage';
import { MeetingTrackerPage } from './pages/MeetingTrackerPage';

export function App() {
  return (
    <Routes>
      <Route path="/join" element={<JoinPage />} />
      <Route path="/login" element={<Navigate to="/crm/login" replace />} />
      <Route path="/crm/login" element={<Login />} />

      {/* ── PUBLIC customer-facing routes — no auth required ── */}
      {/* /body-analysis?phone=919XXXXXXXXX → shows client their health report */}
      <Route path="/body-analysis" element={<BodyAnalysisReport />} />
      {/* /report?phone=... also works (same page) */}
      <Route path="/report" element={<BodyAnalysisReport />} />

      {/* ── AUTHENTICATED coach CRM routes ── */}
      <Route path="/crm" element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="meetings" element={<MeetingTrackerPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:phone" element={<LeadDetailPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="followups" element={<FollowUpsPage />} />
        {/* Coach CRM body analysis is now at /analyses */}
        <Route path="analyses" element={<BodyAnalysisPage />} />
        <Route path="homevisit" element={<ConsumerHomevisitPage />} />
        <Route path="progress" element={<Navigate to="/crm/analyses" replace />} />
        <Route path="orders" element={<OrdersPaymentsPage />} />
        <Route path="revenue" element={<RevenueProfitPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/crm/today" replace />} />
      </Route>
    </Routes>
  );
}
