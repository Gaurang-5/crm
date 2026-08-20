import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BodyAnalysisReport } from './BodyAnalysisReport';
import { BodyAnalysisPage } from './BodyAnalysisPage';

/**
 * Gateway for /body-analysis
 *
 * ?phone=...  → public customer report (no auth required)
 * no phone    → coach CRM view (Layout's requireAuth handles redirect if not logged in)
 */
export function BodyAnalysisGateway() {
  const [params] = useSearchParams();
  const phone = params.get('phone');

  if (phone) {
    return <BodyAnalysisReport />;
  }

  return <BodyAnalysisPage />;
}
