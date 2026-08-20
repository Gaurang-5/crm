import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { CustomerSearch } from '../ui/CustomerSearch';
import { Icons } from '../ui/Icons';

interface Props {
  initialPhone?: string;
  initialName?: string;
  customerId?: string;
  onClose: () => void;
  onSuccess?: (saved: any) => void;
  inline?: boolean;
}

const DRAFT_KEY = 'draft_consumer_homevisit';

export function ConsumerHomevisitModal({ initialPhone = '', initialName = '', customerId, onClose, onSuccess, inline = false }: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [idealWeight, setIdealWeight] = useState('');
  const [healthChallenges, setHealthChallenges] = useState('');
  const [purposeOfJoining, setPurposeOfJoining] = useState('');
  const [energy, setEnergy] = useState('');
  const [digestion, setDigestion] = useState('');
  const [sleep, setSleep] = useState('');
  const [sleepingTime, setSleepingTime] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState('');
  const [breakfastTime, setBreakfastTime] = useState('');
  const [midMeal1, setMidMeal1] = useState('');
  const [lunch, setLunch] = useState('');
  const [midMeal2, setMidMeal2] = useState('');
  const [dinner, setDinner] = useState('');
  const [exercise, setExercise] = useState('');
  const [waterIntake, setWaterIntake] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [fruitSalad, setFruitSalad] = useState('');
  const [tea, setTea] = useState('');
  const [nonVeg, setNonVeg] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const toast = useToast();

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.phone) setPhone(d.phone);
        if (d.date) setDate(d.date);
        if (d.name) setName(d.name);
        if (d.age) setAge(d.age);
        if (d.height) setHeight(d.height);
        if (d.weight) setWeight(d.weight);
        if (d.idealWeight) setIdealWeight(d.idealWeight);
        if (d.healthChallenges) setHealthChallenges(d.healthChallenges);
        if (d.purposeOfJoining) setPurposeOfJoining(d.purposeOfJoining);
        if (d.energy) setEnergy(d.energy);
        if (d.digestion) setDigestion(d.digestion);
        if (d.sleep) setSleep(d.sleep);
        if (d.sleepingTime) setSleepingTime(d.sleepingTime);
        if (d.wakeUpTime) setWakeUpTime(d.wakeUpTime);
        if (d.breakfastTime) setBreakfastTime(d.breakfastTime);
        if (d.midMeal1) setMidMeal1(d.midMeal1);
        if (d.lunch) setLunch(d.lunch);
        if (d.midMeal2) setMidMeal2(d.midMeal2);
        if (d.dinner) setDinner(d.dinner);
        if (d.exercise) setExercise(d.exercise);
        if (d.waterIntake) setWaterIntake(d.waterIntake);
        if (d.familyMembers) setFamilyMembers(d.familyMembers);
        if (d.fruitSalad) setFruitSalad(d.fruitSalad);
        if (d.tea) setTea(d.tea);
        if (d.nonVeg) setNonVeg(d.nonVeg);
        setDraftRestored(true);
      }
    } catch (_) {}
  }, []);

  // Save draft to localStorage on changes
  useEffect(() => {
    const isDirty = name || phone || age || weight || height || healthChallenges || purposeOfJoining;
    if (!isDirty) return;

    const draft = {
      phone,
      date,
      name,
      age,
      height,
      weight,
      idealWeight,
      healthChallenges,
      purposeOfJoining,
      energy,
      digestion,
      sleep,
      sleepingTime,
      wakeUpTime,
      breakfastTime,
      midMeal1,
      lunch,
      midMeal2,
      dinner,
      exercise,
      waterIntake,
      familyMembers,
      fruitSalad,
      tea,
      nonVeg,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (_) {}
  }, [phone, date, name, age, height, weight, idealWeight, healthChallenges, purposeOfJoining, energy, digestion, sleep, sleepingTime, wakeUpTime, breakfastTime, midMeal1, lunch, midMeal2, dinner, exercise, waterIntake, familyMembers, fruitSalad, tea, nonVeg]);

  const calculateIdealWeight = () => {
    const num = parseInt(height.replace(/\D/g, ''), 10);
    if (!num) return;
    if (num <= 142) setIdealWeight('46');
    else if (num <= 145) setIdealWeight('47');
    else if (num <= 147) setIdealWeight('49');
    else if (num <= 150) setIdealWeight('50');
    else if (num <= 152) setIdealWeight('51');
    else if (num <= 155) setIdealWeight('53');
    else if (num <= 157) setIdealWeight('54');
    else if (num <= 160) setIdealWeight('56');
    else if (num <= 162) setIdealWeight('57');
    else if (num <= 165) setIdealWeight('59');
    else if (num <= 167) setIdealWeight('60');
    else if (num <= 170) setIdealWeight('62');
    else if (num <= 172) setIdealWeight('63');
    else if (num <= 175) setIdealWeight('65');
    else if (num <= 177) setIdealWeight('66');
    else setIdealWeight('68');
  };

  const isFormDirty = () => {
    return !!(name || phone || age || weight || height || healthChallenges || purposeOfJoining || sleepingTime || wakeUpTime);
  };

  const handleRequestClose = () => {
    if (isFormDirty()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSaveDraftAndClose = () => {
    toast.info('Draft preserved. You can continue anytime.');
    setShowCloseConfirm(false);
    onClose();
  };

  const handleDiscardAndClose = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}
    setShowCloseConfirm(false);
    onClose();
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}
    setName('');
    setPhone('');
    setAge('');
    setHeight('');
    setWeight('');
    setIdealWeight('');
    setHealthChallenges('');
    setPurposeOfJoining('');
    setEnergy('');
    setDigestion('');
    setSleep('');
    setSleepingTime('');
    setWakeUpTime('');
    setBreakfastTime('');
    setMidMeal1('');
    setLunch('');
    setMidMeal2('');
    setDinner('');
    setExercise('');
    setWaterIntake('');
    setFamilyMembers('');
    setFruitSalad('');
    setTea('');
    setNonVeg('');
    setDraftRestored(false);
    toast.info('Draft cleared.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        date,
        name,
        age,
        height,
        weight,
        ideal_weight: idealWeight,
        phone_number: phone,
        health_challenges: healthChallenges,
        purpose_of_joining: purposeOfJoining,
        energy,
        digestion,
        sleep,
        sleeping_time: sleepingTime,
        wake_up_time: wakeUpTime,
        breakfast_time: breakfastTime,
        mid_meal_1: midMeal1,
        lunch,
        mid_meal_2: midMeal2,
        dinner,
        exercise,
        water_intake: waterIntake,
        family_members: familyMembers,
        fruit_salad: fruitSalad,
        tea,
        non_veg: nonVeg,
      };

      const res: any = await api.saveConsumerHomevisit(payload);
      if (res.success) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (_) {}
        toast.success('Consumer Data Profile saved successfully.');
        if (onSuccess) onSuccess(res.consumerData);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={inline ? "" : "modal-overlay"}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, ...(inline ? { padding: 0 } : {}) }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        style={{ maxWidth: inline ? '100%' : '900px', maxHeight: inline ? 'none' : '90vh', overflowY: 'auto', border: inline ? 'none' : undefined, boxShadow: inline ? 'none' : undefined, flex: 1, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Consumer Data Profile (Home Visit)</h2>
          {!inline && (
            <button className="modal-close" type="button" onClick={handleRequestClose} aria-label="Close">
              <Icons.Close size={16} />
            </button>
          )}
        </div>

        {/* Draft Restored Banner */}
        {draftRestored && (
          <div className="alert alert-info mx-4 mt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-xs)' }}>Restored your previously unsaved draft.</span>
            <button type="button" onClick={clearDraft} className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: '0.7rem' }}>
              Clear Draft
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mx-4 mt-4" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icons.AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Close Confirmation Modal */}
        {showCloseConfirm && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div className="card" style={{ maxWidth: 440, width: '100%', background: '#ffffff', boxShadow: 'var(--shadow-modal)', border: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
                Unsaved Form Data
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-5)' }}>
                You have started filling out this consumer evaluation. Would you like to save it as a draft to finish later, or discard your changes?
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndClose}
                  className="btn btn-danger btn-sm"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraftAndClose}
                  className="btn btn-primary btn-sm"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="card card-flat space-y-4">
            <h4 className="text-subheading border-b pb-1">General Information</h4>

            {/* Quick customer/lead lookup */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--clr-brand)', fontWeight: 600 }}>
                Quick Fill — Search existing customer or lead
              </label>
              <CustomerSearch
                placeholder="Type name or phone to auto-fill..."
                onSelect={(p) => {
                  setPhone(p.phone);
                  if (p.name) setName(p.name);
                  toast.info(`Filled details for ${p.name || p.phone}`);
                }}
              />
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)', marginTop: 'var(--space-1)' }}>
                Or enter client details manually below:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  placeholder="10 digit number"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input type="number" required value={age} onChange={(e) => setAge(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm) *</label>
                <input type="text" required value={height} onChange={(e) => setHeight(e.target.value)} onBlur={calculateIdealWeight} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (Kg) *</label>
                <input type="number" step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} className="form-input" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Ideal Weight (Kg) *</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input type="number" step="0.1" required value={idealWeight} onChange={(e) => setIdealWeight(e.target.value)} className="form-input" />
                  <button type="button" onClick={calculateIdealWeight} className="btn btn-secondary text-[11px]">Auto</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Family Members *</label>
                <input type="text" required value={familyMembers} onChange={(e) => setFamilyMembers(e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          <div className="card card-flat space-y-4">
            <h4 className="text-subheading border-b pb-1">Health & Goals</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Health Challenges *</label>
                <input type="text" required value={healthChallenges} onChange={(e) => setHealthChallenges(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Purpose of Joining *</label>
                <input type="text" required value={purposeOfJoining} onChange={(e) => setPurposeOfJoining(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Energy Levels *</label>
                <input type="text" required value={energy} onChange={(e) => setEnergy(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Digestion *</label>
                <input type="text" required value={digestion} onChange={(e) => setDigestion(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Sleep Quality *</label>
                <input type="text" required value={sleep} onChange={(e) => setSleep(e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          <div className="card card-flat space-y-4">
            <h4 className="text-subheading border-b pb-1">Routine & Diet</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="form-label">Sleeping Time *</label>
                <input type="text" required value={sleepingTime} onChange={(e) => setSleepingTime(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Wake Up Time *</label>
                <input type="text" required value={wakeUpTime} onChange={(e) => setWakeUpTime(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Breakfast *</label>
                <input type="text" required value={breakfastTime} onChange={(e) => setBreakfastTime(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Mid Meal 1 *</label>
                <input type="text" required value={midMeal1} onChange={(e) => setMidMeal1(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Lunch *</label>
                <input type="text" required value={lunch} onChange={(e) => setLunch(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Mid Meal 2 *</label>
                <input type="text" required value={midMeal2} onChange={(e) => setMidMeal2(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Dinner *</label>
                <input type="text" required value={dinner} onChange={(e) => setDinner(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Water Intake *</label>
                <input type="text" required value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Exercise *</label>
                <input type="text" required value={exercise} onChange={(e) => setExercise(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Fruit / Salad *</label>
                <input type="text" required value={fruitSalad} onChange={(e) => setFruitSalad(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Tea/Coffee *</label>
                <input type="text" required value={tea} onChange={(e) => setTea(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Non-Veg *</label>
                <input type="text" required value={nonVeg} onChange={(e) => setNonVeg(e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            {!inline && (
              <button type="button" onClick={handleRequestClose} className="btn btn-secondary">
                Cancel
              </button>
            )}
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : 'Save Consumer Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
