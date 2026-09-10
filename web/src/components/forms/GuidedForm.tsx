import React, { Children, useLayoutEffect, useRef, useState } from 'react';
import './guided-form.css';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export function SavingState({ report = false }: { report?: boolean }) {
  return <div className="guided-saving" role="status" aria-live="polite"><span className="guided-orbit" aria-hidden="true"/><h3>{report ? 'Preparing your report' : 'Saving this visit'}</h3><p>{report ? 'Your readings are being processed. Your report will appear here when it’s ready.' : 'Please keep this window open while we save your details.'}</p></div>;
}
export function GuidedForm({ children, steps, onSubmit, busy = false }: { children: React.ReactNode; steps: string[]; onSubmit: (e: React.FormEvent) => void; busy?: boolean }) {
  const [step, setStep] = useState(0);
  const [review, setReview] = useState<{ label: string; value: string }[][]>([]);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const parts = Children.toArray(children);
  const sections = parts.slice(0, -1);
  const footer = parts[parts.length - 1];
  const labels = [...steps, 'Review'];
  useLayoutEffect(() => {
    // Associate the existing labels without changing any field or its value.
    form.current?.querySelectorAll('.form-group').forEach((group, index) => {
      const label = group.querySelector('label');
      const input = group.querySelector<Field>('input:not([type=radio]), select, textarea');
      if (label && input && !input.id) { input.id = `guided-${steps[0].replace(/\W/g, '')}-${index}`; label.htmlFor = input.id; }
    });
  }, [steps]);
  const go = (next: number) => { setStep(next); requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); const container = form.current?.closest('.modal-content'); if (container) container.scrollTop = 0; else heading.current?.scrollIntoView({ block: 'nearest' }); }); };
  const validate = (index: number) => {
    const fields = form.current?.querySelectorAll<Field>(`[data-form-step="${index}"] input, [data-form-step="${index}"] select, [data-form-step="${index}"] textarea`);
    const invalid = Array.from(fields || []).find(field => !field.checkValidity());
    if (invalid) { go(index); requestAnimationFrame(() => { invalid.focus(); invalid.reportValidity(); }); return false; }
    return true;
  };
  const captureReview = () => setReview(sections.map((_, index) => Array.from(form.current?.querySelectorAll<HTMLElement>(`[data-form-step="${index}"] .form-group`) || []).flatMap(group => {
    const fields = Array.from(group.querySelectorAll<Field>('input,select,textarea')).filter(field => field.type !== 'radio' || (field as HTMLInputElement).checked);
    if (!fields.length || group.querySelector('[role=combobox]') || group.textContent?.includes('Quick Fill')) return [];
    return [{ label: group.querySelector('label')?.textContent?.replace('*', '').trim() || 'Details', value: fields.map(field => field.type === 'radio' ? field.parentElement?.textContent?.trim() : field.value).filter(Boolean).join(', ') || '—' }];
  })));
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    if (step < sections.length) { if (validate(step)) { captureReview(); go(step + 1); } return; }
    for (let index = 0; index < sections.length; index++) if (!validate(index)) return;
    onSubmit(e);
  };
  return <form ref={form} onSubmit={submit} noValidate className="guided-form" aria-busy={busy}>
    <header className="guided-heading"><span>Step {step + 1} of {labels.length}</span><h3 ref={heading} tabIndex={-1}>{labels[step]}</h3><p>{step === sections.length ? 'Take a moment to check the details before saving.' : 'One section at a time. You can go back without losing your entries.'}</p>
      <nav aria-label="Form progress">{labels.map((label, index) => <button key={label} type="button" disabled={busy || index > step} aria-current={index === step ? 'step' : undefined} onClick={() => go(index)}><span>{index < step ? '✓' : index + 1}</span><small>{label}</small></button>)}</nav>
    </header>
    <fieldset disabled={busy} className="guided-fields">
      {sections.map((section, index) => <div key={index} data-form-step={index} hidden={step !== index} className="guided-panel">{section}</div>)}
      {step === sections.length && <div className="guided-review guided-panel">{review.map((fields, index) => <section key={index}><header><h4>{steps[index]}</h4><button type="button" className="btn btn-secondary btn-sm" onClick={() => go(index)}>Edit</button></header><dl>{fields.map((field, i) => <div key={i}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></section>)}</div>}
    </fieldset>
    {busy && <SavingState />}
    <div className="guided-actions"><button type="button" className="btn btn-secondary" disabled={step === 0 || busy} onClick={() => go(step - 1)}>← Back</button>{step < sections.length ? <button type="submit" className="btn btn-primary" disabled={busy}>{step === sections.length - 1 ? 'Review details' : 'Continue'} →</button> : footer}</div>
  </form>;
}
