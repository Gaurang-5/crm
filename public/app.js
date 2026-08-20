let currentCoachId = 'coach_sarika';
let appSettings = {};

window.onload = async () => {
  await fetchSettings();
  await loadCoaches();
  document.getElementById('globalCoachSelect').value = currentCoachId;
  switchTab('tab-camp');
};

async function fetchSettings() {
  const res = await fetch('/api/settings');
  appSettings = await res.json();
  renderFlavorsAndRules();
}

async function loadCoaches() {
  const res = await fetch('/api/coaches');
  const coaches = await res.json();
  const select = document.getElementById('globalCoachSelect');
  select.innerHTML = '<option value="__ALL__">🌐 All Coaches (Senior View)</option>';
  
  const listEl = document.getElementById('coachesList');
  if (listEl) listEl.innerHTML = '';
  
  coaches.forEach(c => {
    // Add to dropdown
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name + (c.role === 'SENIOR_COACH' ? ' (Senior)' : '');
    select.appendChild(opt);
    
    // Add to settings list
    if (listEl) {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <strong>${c.name}</strong> (${c.role})<br>
          <span style="font-size:0.85rem; color:#64748b">${c.phone} | ${c.club_name}</span>
        </div>
        <button class="small-btn secondary-btn" onclick="editCoach('${c.id}')">Edit</button>
      `;
      listEl.appendChild(li);
    }
  });
  select.value = currentCoachId;
}

function handleCoachChange() {
  currentCoachId = document.getElementById('globalCoachSelect').value;
  // Reload current active tab data
  const activeTab = document.querySelector('.nav-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1];
  switchTab(activeTab);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');

  const titles = {
    'tab-camp': { title: '📊 Camp Body Analyses', sub: 'Manage physical camp scans and AI health reports.' },
    'tab-leads': { title: '👥 Leads & Funnel', sub: 'Track WhatsApp funnel state and interactions.' },
    'tab-visits': { title: '🏠 1st Home Visits', sub: 'Customer intake and routine assignments.' },
    'tab-profit': { title: '💰 Cash Profit Sheet', sub: 'Monthly sales and profit tracker for senior coaches.' },
    'tab-flavors': { title: '📖 Flavors & Rules', sub: 'Interactive catalogs and standard instructions.' },
    'tab-settings': { title: '⚙️ Settings', sub: 'Platform configuration.' }
  };
  document.getElementById('pageTitle').textContent = titles[tabId].title;
  document.getElementById('pageSubtitle').textContent = titles[tabId].sub;

  if (tabId === 'tab-camp') loadBodyAnalyses();
  if (tabId === 'tab-leads') loadLeads();
  if (tabId === 'tab-visits') loadHomeVisits();
  if (tabId === 'tab-profit') loadProfitSheets();
}

// -----------------------------------------------------
// MODALS
// -----------------------------------------------------
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function openManageCoachesModal() {
  openModal('modalManageCoaches');
}

function editCoach(id) {
  alert('Coach editing coming soon! ID: ' + id);
}

async function submitAddCoach(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('newCoachName').value,
    phone: document.getElementById('newCoachPhone').value,
    role: document.getElementById('newCoachRole').value,
    club_name: document.getElementById('newCoachClub').value,
    zoom_link: document.getElementById('newCoachZoom').value,
    session_time: document.getElementById('newCoachTime').value,
  };
  const res = await fetch('/api/coaches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    e.target.reset();
    await loadCoaches();
    alert('Coach added successfully!');
  }
}

// -----------------------------------------------------
// TAB 1: CAMP ANALYSES
// -----------------------------------------------------
async function loadBodyAnalyses() {
  const query = document.getElementById('searchCamp')?.value.toLowerCase() || '';
  const filter = document.getElementById('filterCamp')?.value || 'ALL';
  
  const res = await fetch(`/api/body-analyses?coachId=${currentCoachId}`);
  const data = await res.json();
  
  let filtered = data.filter(r => 
    r.name.toLowerCase().includes(query) || 
    r.phone_number.includes(query)
  );

  if (filter === 'VISCERAL_HIGH') {
    filtered = filtered.filter(r => r.visceral_fat > 8);
  } else if (filter === 'OVERWEIGHT') {
    filtered = filtered.filter(r => r.bmi >= 25);
  }

  // Update Metrics
  let highVisceral = data.filter(r => r.visceral_fat > 8).length;
  let overweight = data.filter(r => r.bmi >= 25).length;
  
  document.getElementById('campMetrics').innerHTML = `
    <div class="metric-card"><h4>Total Scans</h4><div class="value">${data.length}</div></div>
    <div class="metric-card"><h4>⚠️ Visceral Alerts</h4><div class="value" style="color:#ef4444">${highVisceral}</div></div>
    <div class="metric-card"><h4>Overweight (BMI >25)</h4><div class="value" style="color:#f59e0b">${overweight}</div></div>
  `;
  document.getElementById('navBadgeCamp').textContent = data.length;

  const tbody = document.querySelector('#campTable tbody');
  tbody.innerHTML = '';
  filtered.forEach((r, i) => {
    let bmiBadge = 'bg-green';
    if (r.bmi < 18.5) bmiBadge = 'bg-blue';
    else if (r.bmi >= 25) bmiBadge = 'bg-yellow';
    if (r.bmi >= 30) bmiBadge = 'bg-red';
    
    let vfBadge = r.visceral_fat > 8 ? '<span class="status-badge bg-red">⚠️ High</span>' : '<span class="status-badge bg-green">OK</span>';

    tbody.innerHTML += `
      <tr>
        <td>${filtered.length - i}</td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
        <td>${(r.coach_id || '').replace('coach_', '')}</td>
        <td><strong>${r.name}</strong><br><small style="color:#64748b">${r.phone_number}</small></td>
        <td>${r.age} yrs / ${r.gender}</td>
        <td>${r.weight_kg}kg <br><small style="color:#166534">(Target: ${r.ideal_weight_kg || '-'}kg)</small></td>
        <td><span class="status-badge ${bmiBadge}">${r.bmi}</span></td>
        <td>${r.visceral_fat} ${vfBadge}</td>
        <td>${r.body_fat_pct || '-'}%</td>
        <td>${r.skeletal_muscle_pct || '-'}%</td>
        <td>${r.body_age || '-'} / ${r.bmr || '-'}</td>
        <td>
          <button class="action-link" onclick="viewReport('${r.phone_number}')">👁️ Report</button>
          ${r.pdf_filename ? `<a href="/reports/${r.pdf_filename}" target="_blank" class="action-link">📄 PDF</a>` : ''}
        </td>
      </tr>
    `;
  });
}

function openBodyAnalysisModal() {
  document.getElementById('formBodyAnalysis').reset();
  document.getElementById('baLivePreview').innerHTML = '<strong>⚡ Live Calculator:</strong> Fill height & weight to see target metrics.';
  openModal('modalBodyAnalysis');
}

async function calculateLiveMetrics() {
  const h = document.getElementById('ba_height').value;
  const w = document.getElementById('ba_weight').value;
  const g = document.getElementById('ba_gender').value;
  const a = document.getElementById('ba_age').value;
  const ba = document.getElementById('ba_bodyage').value;

  if (h && w) {
    const res = await fetch(`/api/ideal-weight?heightCm=${h}&gender=${g}`);
    const data = await res.json();
    const ideal = data.idealWeightKg;
    const diff = w - ideal;
    
    const bmi = (w / Math.pow(h/100, 2)).toFixed(1);
    let water = (w / 20).toFixed(1);

    let html = `
      <strong>⚡ Live Preview:</strong><br>
      • BMI: <strong>${bmi}</strong><br>
      • Ideal Weight: <strong>${ideal} kg</strong> (Gap: ${diff > 0 ? 'Lose ' + diff.toFixed(1) : 'Gain ' + Math.abs(diff).toFixed(1)} kg)<br>
      • Daily Water Req: <strong>${water} Litres</strong>
    `;
    if (a && ba) {
      const ageGap = ba - a;
      html += `<br>• Metabolic Age Gap: ${ageGap > 0 ? '+' + ageGap + ' years (Needs Improvement)' : 'Good'}`;
    }
    document.getElementById('baLivePreview').innerHTML = html;
  }
}

async function submitBodyAnalysis(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitBA');
  btn.disabled = true;
  btn.textContent = 'Generating AI Report & PDF... Please wait (15-20s)';
  
  try {
    const data = {
      coachId: currentCoachId === '__ALL__' ? 'coach_sarika' : currentCoachId,
      phone: document.getElementById('ba_phone').value,
      name: document.getElementById('ba_name').value,
      age: document.getElementById('ba_age').value,
      gender: document.getElementById('ba_gender').value,
      heightCm: document.getElementById('ba_height').value,
      weightKg: document.getElementById('ba_weight').value,
      subFatPct: document.getElementById('ba_subfat').value,
      visceralFat: document.getElementById('ba_visceral').value,
      skeletalMusclePct: document.getElementById('ba_muscle').value,
      bodyFatPct: document.getElementById('ba_bodyfat').value,
      bodyAge: document.getElementById('ba_bodyage').value,
      bmr: document.getElementById('ba_bmr').value,
      sendWhatsApp: document.getElementById('ba_sendWhatsapp').checked,
    };
    
    const res = await fetch('/api/body-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      closeModal('modalBodyAnalysis');
      loadBodyAnalyses();
      loadLeads();
    } else {
      const err = await res.json();
      alert('Error: ' + err.error);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save & Generate Report';
  }
}

async function viewReport(phone) {
  const res = await fetch('/api/leads/' + phone);
  const data = await res.json();
  if (data.analyses && data.analyses.length > 0) {
    document.getElementById('reportText').textContent = data.analyses[0].hindi_report;
    openModal('modalViewReport');
  } else {
    alert('Report not found');
  }
}

// -----------------------------------------------------
// TAB 2: LEADS
// -----------------------------------------------------
async function loadLeads() {
  const query = document.getElementById('searchLeads')?.value.toLowerCase() || '';
  const filter = document.getElementById('filterFunnelState')?.value || 'ALL';
  
  const res = await fetch(`/api/leads?coachId=${currentCoachId}`);
  const data = await res.json();
  
  let filtered = data.filter(l => 
    (l.display_name && l.display_name.toLowerCase().includes(query)) || 
    l.phone_number.includes(query)
  );
  if (filter !== 'ALL') {
    filtered = filtered.filter(l => l.funnel_state === filter);
  }

  document.getElementById('leadMetrics').innerHTML = `
    <div class="metric-card"><h4>Total Leads</h4><div class="value">${data.length}</div></div>
    <div class="metric-card"><h4>Analyses Done</h4><div class="value" style="color:#1e40af">${data.filter(l => l.funnel_state==='ANALYSIS_DONE').length}</div></div>
    <div class="metric-card"><h4>Attended Zoom</h4><div class="value" style="color:#854d0e">${data.filter(l => l.funnel_state==='ATTENDED_ZOOM').length}</div></div>
    <div class="metric-card"><h4>Orders Placed</h4><div class="value" style="color:#166534">${data.filter(l => l.funnel_state==='ORDER_PLACED').length}</div></div>
  `;
  document.getElementById('navBadgeLeads').textContent = data.length;

  const tbody = document.querySelector('#leadsTable tbody');
  tbody.innerHTML = '';
  filtered.forEach(l => {
    let actionBtn = '';
    if (l.funnel_state === 'ANALYSIS_DONE' || l.funnel_state === 'INVITED_TO_ZOOM') {
      actionBtn = `<button class="small-btn secondary-btn" onclick="markZoomAttended('${l.phone_number}')">Mark Zoom Attended</button>`;
    } else if (l.funnel_state === 'ORDER_PLACED') {
      actionBtn = `<button class="small-btn primary-btn" onclick="markOrderDelivered('${l.phone_number}')">Mark Delivered</button>`;
    } else if (l.funnel_state === 'ORDER_DELIVERED') {
      actionBtn = `<button class="small-btn secondary-btn" onclick="document.getElementById('hv_phone').value='${l.phone_number}'; document.getElementById('hv_name').value='${l.display_name||''}'; switchTab('tab-visits'); openHomeVisitModal();">Schedule Home Visit</button>`;
    }

    let badgeClass = 'bg-gray';
    if (l.funnel_state === 'ORDER_PLACED' || l.funnel_state === 'ORDER_DELIVERED' || l.funnel_state === 'HOME_VISIT_DONE') badgeClass = 'bg-green';
    if (l.funnel_state === 'ATTENDED_ZOOM') badgeClass = 'bg-yellow';
    if (l.funnel_state === 'ANALYSIS_DONE' || l.funnel_state === 'INVITED_TO_ZOOM') badgeClass = 'bg-blue';

    tbody.innerHTML += `
      <tr>
        <td>${new Date(l.updated_at).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
        <td>${(l.coach_id || '').replace('coach_', '')}</td>
        <td><strong>${l.display_name || 'Customer'}</strong><br><small>${l.phone_number}</small></td>
        <td><span class="status-badge ${badgeClass}">${l.funnel_state}</span></td>
        <td>${actionBtn}</td>
      </tr>
    `;
  });
}

async function markZoomAttended(phone) {
  if (confirm('Mark this lead as having attended the Zoom session? This will send the Pricing options.')) {
    await fetch('/api/leads/' + phone + '/attended-zoom', { method: 'POST' });
    loadLeads();
  }
}
async function markOrderDelivered(phone) {
  if (confirm('Mark order as delivered?')) {
    await fetch('/api/leads/' + phone + '/order-status', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status: 'ORDER_DELIVERED'})
    });
    loadLeads();
  }
}

// -----------------------------------------------------
// TAB 3: HOME VISITS
// -----------------------------------------------------
async function loadHomeVisits() {
  const query = document.getElementById('searchVisits')?.value.toLowerCase() || '';
  const res = await fetch(`/api/home-visits?coachId=${currentCoachId}`);
  const data = await res.json();
  
  const filtered = data.filter(r => r.phone_number.includes(query) || (r.member_name && r.member_name.toLowerCase().includes(query)));

  const basic = data.filter(r => r.routine_type === 'Basic').length;
  const elite = data.filter(r => r.routine_type === 'Elite').length;
  
  document.getElementById('visitMetrics').innerHTML = `
    <div class="metric-card"><h4>Total Visits</h4><div class="value">${data.length}</div></div>
    <div class="metric-card"><h4>Basic Routines</h4><div class="value" style="color:#1e40af">${basic}</div></div>
    <div class="metric-card"><h4>Elite Routines</h4><div class="value" style="color:#854d0e">${elite}</div></div>
  `;
  document.getElementById('navBadgeVisits').textContent = data.length;

  const tbody = document.querySelector('#visitsTable tbody');
  tbody.innerHTML = '';
  filtered.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>#${r.id}</td>
        <td>${new Date(r.visit_date).toLocaleDateString()}</td>
        <td>${(r.coach_id || '').replace('coach_','')}</td>
        <td><strong>${r.member_name || 'Member'}</strong><br><small>${r.phone_number}</small></td>
        <td><span class="status-badge ${r.routine_type==='Elite'?'bg-yellow':'bg-blue'}">${r.routine_type}</span></td>
        <td>${r.purpose_of_joining || '-'}<br><small style="color:#dc2626">${r.health_challenges||''}</small></td>
        <td><small>Wake: ${r.wake_up_time||'-'} | Sleep: ${r.sleeping_time||'-'}</small></td>
        <td><small>Water: ${r.water_intake||'-'}</small></td>
        <td><button class="small-btn secondary-btn" onclick="alert('Resend routine on WhatsApp coming soon')">💬 Re-send Routine</button></td>
      </tr>
    `;
  });
}

function openHomeVisitModal() {
  document.getElementById('formHomeVisit').reset();
  openModal('modalHomeVisit');
}

async function submitHomeVisit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitHV');
  btn.disabled = true;
  btn.textContent = 'Saving & Sending WhatsApp...';
  try {
    const data = {
      coach_id: currentCoachId === '__ALL__' ? 'coach_sarika' : currentCoachId,
      phone_number: document.getElementById('hv_phone').value,
      member_name: document.getElementById('hv_name').value,
      routine_type: document.getElementById('hv_routine').value,
      health_challenges: document.getElementById('hv_challenges').value,
      wake_up_time: document.getElementById('hv_wake').value,
      sleeping_time: document.getElementById('hv_sleep').value,
      sendWhatsApp: document.getElementById('hv_sendWhatsapp').checked,
    };
    const res = await fetch('/api/home-visit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (res.ok) {
      closeModal('modalHomeVisit');
      loadHomeVisits();
      loadLeads();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Intake & Assign Routine';
  }
}

// -----------------------------------------------------
// TAB 4: PROFIT SHEETS
// -----------------------------------------------------
async function loadProfitSheets() {
  const res = await fetch(`/api/profit-sheets?coachId=${currentCoachId}`);
  const data = await res.json();
  const sel = document.getElementById('sheetSelector');
  sel.innerHTML = '';
  data.sheets.forEach(s => {
    sel.innerHTML += `<option value="${s.sheet_id}">${s.sheet_id}</option>`;
  });
  if (data.sheets.length > 0) {
    sel.value = data.sheets[0].sheet_id;
  } else {
    sel.innerHTML = `<option value="${data.currentSheet}">${data.currentSheet}</option>`;
  }
  loadProfitSheetEntries();
}

async function loadProfitSheetEntries() {
  const sheetId = document.getElementById('sheetSelector').value;
  if (!sheetId) return;
  const res = await fetch(`/api/profit-sheets/${sheetId}?coachId=${currentCoachId}`);
  const data = await res.json();

  document.getElementById('profitMetrics').innerHTML = `
    <div class="metric-card"><h4>Monthly Total Received</h4><div class="value">₹${data.totals.totalReceived.toLocaleString('en-IN')}</div></div>
    <div class="metric-card" style="background:#f0fdf4"><h4>🟢 Monthly Cash Profit</h4><div class="value" style="color:#166534">₹${data.totals.totalProfit.toLocaleString('en-IN')}</div></div>
    <div class="metric-card"><h4>Lifetime Customers</h4><div class="value">${data.lifetime.lifetimeCustomers}</div></div>
    <div class="metric-card"><h4>⭐ Lifetime Profit</h4><div class="value" style="color:#854d0e">₹${data.lifetime.lifetimeProfit.toLocaleString('en-IN')}</div></div>
  `;
  document.getElementById('navBadgeProfit').textContent = data.entries.length;

  const tbody = document.querySelector('#profitTable tbody');
  tbody.innerHTML = '';
  data.entries.forEach((e, idx) => {
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${new Date(e.payment_date).toLocaleDateString('en-IN')}</td>
        <td>${(e.coach_id || '').replace('coach_','')}</td>
        <td><strong>${e.member_name}</strong><br><small>${e.phone_number||''}</small></td>
        <td>${e.membership_type} <span class="status-badge bg-gray">${e.transaction_type}</span></td>
        <td>₹${Number(e.amount_received).toLocaleString('en-IN')}</td>
        <td>₹${Number(e.coach_amount).toLocaleString('en-IN')}</td>
        <td>₹${Number(e.cost_of_kit).toLocaleString('en-IN')}</td>
        <td style="color:#166534; font-weight:700">₹${Number(e.cash_profit).toLocaleString('en-IN')}</td>
        <td><span class="status-badge bg-green">${e.payment_status}</span></td>
        <td><button class="action-link" style="color:#ef4444" onclick="deleteProfitEntry(${e.id})">Delete</button></td>
      </tr>
    `;
  });
}

function openProfitEntryModal() {
  document.getElementById('formProfitEntry').reset();
  autoFillPricing();
  openModal('modalProfitEntry');
}

function autoFillPricing() {
  const membership = document.getElementById('pe_membership').value;
  const type = document.getElementById('pe_type').value;
  
  if (appSettings && appSettings.pricing && appSettings.pricing[membership]) {
    const p = appSettings.pricing[membership];
    document.getElementById('pe_received').value = p.amountReceived;
    document.getElementById('pe_coachamt').value = p.coachAmount;
    document.getElementById('pe_kitcost').value = type === 'Renewal' ? p.costOfKitRenewal : p.costOfKitNew;
    calcProfit();
  }
}
function calcProfit() {
  const coach = Number(document.getElementById('pe_coachamt').value || 0);
  const kit = Number(document.getElementById('pe_kitcost').value || 0);
  document.getElementById('pe_profit').value = coach - kit;
}

async function submitProfitEntry(e) {
  e.preventDefault();
  const data = {
    sheet_id: document.getElementById('sheetSelector').value,
    coach_id: currentCoachId === '__ALL__' ? 'coach_sarika' : currentCoachId,
    phone_number: document.getElementById('pe_phone').value,
    member_name: document.getElementById('pe_name').value,
    membership_type: document.getElementById('pe_membership').value,
    transaction_type: document.getElementById('pe_type').value,
    amount_received: document.getElementById('pe_received').value,
    coach_amount: document.getElementById('pe_coachamt').value,
    cost_of_kit: document.getElementById('pe_kitcost').value,
    cash_profit: document.getElementById('pe_profit').value,
    payment_status: 'Received'
  };
  await fetch('/api/profit-entries', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
  closeModal('modalProfitEntry');
  loadProfitSheetEntries();
}

async function deleteProfitEntry(id) {
  if (confirm('Are you sure you want to delete this profit entry?')) {
    await fetch('/api/profit-entries/' + id, { method: 'DELETE' });
    loadProfitSheetEntries();
  }
}

async function exportProfitSheetPDF() {
  const sheetId = document.getElementById('sheetSelector').value;
  const res = await fetch(`/api/profit-sheets/${sheetId}/pdf?coachId=${currentCoachId}`);
  const data = await res.json();
  if (data.url) {
    window.open(data.url, '_blank');
  }
}

// -----------------------------------------------------
// TAB 5: FLAVORS & RULES
// -----------------------------------------------------
function renderFlavorsAndRules() {
  if (appSettings.formula1Flavors) {
    let html = '<h4>Formula 1 Shakes</h4><div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">';
    appSettings.formula1Flavors.forEach(f => {
      html += `<span class="status-badge bg-gray" style="font-size:0.9rem">${f.emoji} ${f.name}</span>`;
    });
    html += '</div><h4>Afresh Energy Drink</h4><div style="display:flex; flex-wrap:wrap; gap:8px;">';
    appSettings.afreshFlavors.forEach(f => {
      html += `<span class="status-badge bg-green" style="font-size:0.9rem">${f.emoji} ${f.name}</span>`;
    });
    html += '</div>';
    document.getElementById('flavorCatalog').innerHTML = html;
  }
  if (appSettings.rules) {
    document.getElementById('goldenRulesText').textContent = appSettings.rules.join('\n');
  }
}

function copyGoldenRules() {
  const text = document.getElementById('goldenRulesText').textContent;
  navigator.clipboard.writeText(text);
  alert('Rules copied to clipboard!');
}

// -----------------------------------------------------
// WEBHOOK SIMULATOR
// -----------------------------------------------------
async function submitSimulate(e) {
  e.preventDefault();
  const phone = document.getElementById('sim_phone').value;
  const text = document.getElementById('sim_text').value;
  await fetch('/api/simulate-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, name: 'Simulator', text })
  });
  document.getElementById('sim_text').value = '';
  closeModal('modalSimulate');
  setTimeout(() => loadLeads(), 500);
}
