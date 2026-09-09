import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mobileTablePages = [
  'LeadsPage.tsx',
  'CustomersPage.tsx',
  'OrdersPaymentsPage.tsx',
  'RevenueProfitPage.tsx',
  'CampaignsPage.tsx',
  'SettingsPage.tsx',
  'CustomerDetailPage.tsx',
];

describe('mobile CRM tables', () => {
  it.each(mobileTablePages)('%s uses card tables with mobile labels', (page) => {
    const source = readFileSync(resolve(process.cwd(), 'web/src/pages', page), 'utf8');
    expect(source).toContain('responsive-card-table');
    expect(source).toContain('data-label=');
  });
});
