import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PipelinePage } from '../../src/pages/PipelinePage';

describe('PipelinePage Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/pipeline/stages')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { code: 'NEW', name: 'New Lead', order_index: 1 },
            { code: 'WON', name: 'Won (Customer)', order_index: 7 },
            { code: 'LOST', name: 'Lost', order_index: 8 },
          ],
        });
      }
      if (url.includes('/api/leads')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { phone_number: '919876543210', display_name: 'Anjali Sharma', funnel_state: 'NEW', lead_score: 70 },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it('renders Kanban stages and lead cards', async () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sales Pipeline Kanban/i })).toBeInTheDocument();
      expect(screen.getByText('Anjali Sharma')).toBeInTheDocument();
      expect(screen.getByText('Score 70')).toBeInTheDocument();
    });
  });
});
