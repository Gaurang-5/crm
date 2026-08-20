import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegacyIframe } from '../../src/pages/LegacyIframe';

describe('LegacyIframe Component', () => {
  it('renders an iframe pointing to the legacy URL', () => {
    render(<LegacyIframe src="/legacy-leads.html" />);
    const iframe = screen.getByTitle('Legacy Content') as HTMLIFrameElement;
    expect(iframe).toBeDefined();
    expect(iframe.src).toContain('/legacy-leads.html');
  });
});
