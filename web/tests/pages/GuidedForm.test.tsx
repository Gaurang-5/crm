import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import { GuidedForm } from '../../src/components/forms/GuidedForm';
it('validates steps, retains values on Back, reviews entries and submits only at the end', () => {
  Element.prototype.scrollIntoView = vi.fn();
  const save = vi.fn();
  function Example() {
    const [name,setName] = useState('');
    return <GuidedForm steps={['Person','Goals']} onSubmit={save}>
      <div className="form-group"><label>Name</label><input required value={name} onChange={e=>setName(e.target.value)}/></div>
      <div className="form-group"><label>Goal</label><input defaultValue="Wellness"/></div>
      <button type="submit">Save</button>
    </GuidedForm>;
  }
  render(<Example/>);
  fireEvent.click(screen.getByRole('button',{name:/Continue/}));
  expect(screen.getByRole('heading',{name:'Person'})).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Test person'}});
  fireEvent.click(screen.getByRole('button',{name:/Continue/}));
  fireEvent.click(screen.getByRole('button',{name:/Back/}));
  expect(screen.getByLabelText('Name')).toHaveValue('Test person');
  fireEvent.click(screen.getByRole('button',{name:/Continue/}));
  fireEvent.click(screen.getByRole('button',{name:/Review details/}));
  expect(screen.getByText('Test person')).toBeVisible();
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Save',exact:true}));
  expect(save).toHaveBeenCalledTimes(1);
});
