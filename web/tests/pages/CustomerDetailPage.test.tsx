import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CustomerDetailPage } from '../../src/pages/CustomerDetailPage';

describe('CustomerDetailPage Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/customers/cust_1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            customer: {
              id: 'cust_1',
              name: 'Pooja Member',
              phone_number: '919876543210',
              status: 'ACTIVE',
              current_plan: 'Basic',
              start_date: '2026-08-20',
              renewal_date: '2026-09-19',
            },
            onboarding: [
              { id: 1, title: 'Welcome Call & Routine Confirmation', order_index: 1, is_completed: true, completed_at: '2026-08-20' },
              { id: 2, title: 'Schedule Day 1 First Home Visit Session', order_index: 2, is_completed: false },
            ],
            checkins: [
              { id: 1, checkin_date: '2026-08-20', weight_kg: 74, water_liters: 3, meals_compliant: true, energy_level: 4, sleep_hours: 7.5 },
            ],
            measurements: [],
            photos: [],
            milestones: [],
            orders: [],
            payments: [],
            progressSummary: {
              baselineWeight: 74,
              currentWeight: 74,
              totalWeightLossKg: 0,
              checkinCount: 1,
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it('renders customer hub with profile, onboarding items, and check-in stats', async () => {
    render(
      <MemoryRouter initialEntries={['/customers/cust_1']}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pooja Member')).toBeInTheDocument();
      expect(screen.getByText(/Welcome Call & Routine Confirmation/i)).toBeInTheDocument();
      expect(screen.getByText(/Schedule Day 1 First Home Visit Session/i)).toBeInTheDocument();
      expect(screen.getAllByText(/74 kg/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
