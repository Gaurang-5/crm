import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TodayPage } from '../../src/pages/TodayPage';

describe('TodayPage Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        summary: {
          overdueTasksCount: 2,
          newLeadsCount: 3,
          appointmentsTodayCount: 1,
          pendingPaymentsCount: 2,
          renewalsDueCount: 1,
          missedCheckinsCount: 0,
        },
        overdueTasks: [
          { id: 1, title: 'Call Suman for Diet Check', due_date: '2026-08-19', priority: 'HIGH' },
          { id: 2, title: 'Send 1st Home Visit Chart', due_date: '2026-08-18', priority: 'MEDIUM' },
        ],
        upcomingTasks: [],
        newLeads: [
          { phone_number: '919876543210', display_name: 'Pooja Lead', interest_topic: 'Weight Loss' },
        ],
        appointmentsToday: [
          { id: 10, title: 'Live Morning Zoom Orientation', scheduled_at: '2026-08-20T07:30:00', duration_mins: 45, zoom_link: 'https://zoom.us/j/123' },
        ],
        renewalsDue: [
          { id: 'c1', name: 'Kavita Member', daysLeft: 7, renewal_date: '2026-08-27', current_plan: 'Basic', phone_number: '919111222333' },
        ],
        pendingPayments: [
          { customerId: 'c1', customerName: 'Kavita Member', outstandingBalance: 3400, totalPaymentsReceived: 5000 },
        ],
        missedCheckins: [],
        systemHealth: { status: 'HEALTHY', database: 'CONNECTED_POSTGRES' },
      }),
    });
  });

  it('renders summary statistics and task lists properly', async () => {
    render(
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading Today Dashboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Today's Focus")).toBeInTheDocument();
      expect(screen.getByText(/Call Suman for Diet Check/i)).toBeInTheDocument();
      expect(screen.getByText(/Pooja Lead/i)).toBeInTheDocument();
      expect(screen.getByText(/Live Morning Zoom Orientation/i)).toBeInTheDocument();
    });
  });
});
