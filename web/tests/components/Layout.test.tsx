import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../../src/components/Layout';

describe('Layout component', () => {
  it('renders a responsive sidebar', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);
    expect(document.querySelector('nav')).toBeInTheDocument();
  });
});
