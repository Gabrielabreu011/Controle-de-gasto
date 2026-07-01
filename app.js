/* =========================================================
   COFRE — app.js
   Lógica principal: navegação, CRUD, cálculos e renderização.
   ========================================================= */

let DATA = Storage.load();
let currentDate = new Date();
currentDate.setDate(1);

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/* ================= HELPERS ================= */
function formatBRL2(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isSameMonth(txDateStr, date) {
  return txDateStr.slice(0, 7) === monthKey(date);
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function daysRemainingInMonth(date) {
  const total = daysInMonth(date);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth();
  if (!isCurrentMonth) return total; // mês futuro/passado: considera mês inteiro
  return Math.max(1, total - now.getDate() + 1);
}

/* ================= NAVEGAÇÃO ================= */
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');
  document.querySelector(`.nav-item[data-view="${viewName}"]`).classList.add('active');
  renderAll();
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.goto));
});

/* ================= MODAIS ================= */
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

document.getElementById('openTxModal').addEventListener('click', () => {
  document.getElementById('txDate').value = todayISO();
  populateCategorySelect();
  openModal('txModal');
});
document.getElementById('openInvModal').addEventListener('click', () => openModal('invModal'));
document.getElementById('openGoalModal').addEventListener('click', () => openModal('goalModal'));

/* ================= MÊS ================= */
document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderAll();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderAll();
});

function updateMonthLabel() {
  document.getElementById('currentMonthLabel').textContent =
    `${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
}

/* ================= CATEGORIAS ================= */
function getAllCategories() {
  const used = DATA.transactions.map(t => t.category);
  return [...new Set([...DEFAULT_CATEGORIES, ...used])];
}

function populateCategorySelect() {
  const sel = document.getElementById('txCategory');
  sel.innerHTML = '';
  getAllCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function populateFilterCategory() {
  const sel = document.getElementById('filterCategory');
  const current = sel.value;
  sel.innerHTML = '<option value="all">Todas as categorias</option>';
  getAllCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
  sel.value = current || 'all';
}

/* ================= FORM: LANÇAMENTO ================= */
document.getElementById('txForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const type = document.querySelector('input[name="txType"]:checked').value;
  const desc = document.getElementById('txDesc').value.trim();
  const value = parseFloat(document.getElementById('txValue').value);
  const category = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value;

  if (!desc || !value || value <= 0 || !date) return;

  DATA.transactions.push({
    id: Storage.uid(),
    type, desc, value, category, date
  });
  Storage.save(DATA);

  e.target.reset();
  closeModal('txModal');
  renderAll();
});

function deleteTx(id) {
  DATA.transactions = DATA.transactions.filter(t => t.id !== id);
  Storage.save(DATA);
  renderAll();
}

/* ================= FORM: INVESTIMENTO ================= */
document.getElementById('invForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('invName').value.trim();
  const type = document.getElementById('invType').value;
  const value = parseFloat(document.getElementById('invValue').value);

  if (!name || !value || value <= 0) return;

  DATA.investments.push({
    id: Storage.uid(),
    name, type, value, date: todayISO()
  });
  Storage.save(DATA);

  e.target.reset();
  closeModal('invModal');
  renderAll();
});

function deleteInv(id) {
  DATA.investments = DATA.investments.filter(i => i.id !== id);
  Storage.save(DATA);
  renderAll();
}

/* ================= FORM: METAS ================= */
document.getElementById('goalForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value);
  const current = parseFloat(document.getElementById('goalCurrent').value) || 0;

  if (!name || !target || target <= 0) return;

  DATA.goals.push({ id: Storage.uid(), name, target, current });
  Storage.save(DATA);

  e.target.reset();
  closeModal('goalModal');
  renderAll();
});

function deleteGoal(id) {
  DATA.goals = DATA.goals.filter(g => g.id !== id);
  Storage.save(DATA);
  renderAll();
}

let activeGoalId = null;
function openGoalAdd(id) {
  activeGoalId = id;
  document.getElementById('goalAddId').value = id;
  openModal('goalAddModal');
}

document.getElementById('goalAddForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('goalAddId').value;
  const value = parseFloat(document.getElementById('goalAddValue').value);
  const goal = DATA.goals.find(g => g.id === id);
  if (goal && value > 0) {
    goal.current = Math.min(goal.target, goal.current + value);
    Storage.save(DATA);
  }
  e.target.reset();
  closeModal('goalAddModal');
  renderAll();
});

/* ================= CONFIGURAÇÕES ================= */
document.getElementById('saveConfig').addEventListener('click', () => {
  DATA.config.expectedIncome = parseFloat(document.getElementById('expectedIncome').value) || 0;
  DATA.config.reservePercent = parseFloat(document.getElementById('reservePercent').value) || 0;
  Storage.save(DATA);
  renderAll();
  alert('Configurações salvas.');
});

document.getElementById('exportData').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cofre-dados.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('clearData').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar todos os dados? Essa ação não pode ser desfeita.')) {
    Storage.clear();
    DATA = Storage.load();
    renderAll();
  }
});

/* ================= FILTROS DE LANÇAMENTOS ================= */
document.getElementById('searchTx').addEventListener('input', renderTxTable);
document.getElementById('filterType').addEventListener('change', renderTxTable);
document.getElementById('filterCategory').addEventListener('change', renderTxTable);

/* ================= CÁLCULOS PRINCIPAIS ================= */
function getMonthTransactions(date) {
  return DATA.transactions.filter(t => isSameMonth(t.date, date));
}

function calcMonthStats(date) {
  const txs = getMonthTransactions(date);
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0);
  return { income, expense };
}

function calcSafeToSpend(date) {
  const { income, expense } = calcMonthStats(date);
  const baseIncome = income > 0 ? income : (DATA.config.expectedIncome || 0);
  const reserve = baseIncome * ((DATA.config.reservePercent || 0) / 100);
  const available = Math.max(0, baseIncome - reserve - expense);
  const days = daysRemainingInMonth(date);
  return { perDay: available / days, available, baseIncome, reserve };
}

/* ================= RENDER: DASHBOARD ================= */
function renderDashboard() {
  const { income, expense } = calcMonthStats(currentDate);
  const totalSaved = DATA.goals.reduce((s, g) => s + g.current, 0);
  const totalInvested = DATA.investments.reduce((s, i) => s + i.value, 0);

  document.getElementById('statIncome').textContent = formatBRL2(income);
  document.getElementById('statExpense').textContent = formatBRL2(expense);
  document.getElementById('statSaved').textContent = formatBRL2(totalSaved);
  document.getElementById('statInvested').textContent = formatBRL2(totalInvested);

  const safe = calcSafeToSpend(currentDate);
  document.getElementById('safeToSpendValue').textContent = formatBRL2(safe.perDay);

  const days = daysRemainingInMonth(currentDate);
  document.getElementById('safeToSpendSub').textContent =
    `por dia · ${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;

  // dial: proporção do disponível vs renda base
  const circumference = 653; // 2 * PI * 104
  const ratio = safe.baseIncome > 0 ? Math.min(1, safe.available / safe.baseIncome) : 0;
  const offset = circumference - ratio * circumference;
  const dial = document.getElementById('dialProgress');
  dial.style.strokeDashoffset = offset;
  dial.style.stroke = ratio < 0.15 ? getComputedStyle(document.documentElement).getPropertyValue('--negative') : '';

  // gráfico categorias (mês atual)
  const catMap = {};
  getMonthTransactions(currentDate).filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.value;
  });
  drawCategoryDonut(document.getElementById('categoryChart'), catMap);

  // gráfico fluxo últimos 6 meses
  const months = [];
  const incomes = [];
  const expenses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const stats = calcMonthStats(d);
    months.push(MONTH_NAMES[d.getMonth()].slice(0, 3));
    incomes.push(stats.income);
    expenses.push(stats.expense);
  }
  drawFlowChart(document.getElementById('flowChart'), months, incomes, expenses);

  // últimos lançamentos
  const recentList = document.getElementById('recentList');
  const recent = [...DATA.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  recentList.innerHTML = recent.length ? recent.map(txRowHTML).join('') :
    '<p class="empty-note">Nenhum lançamento ainda.</p>';
}

function txRowHTML(t) {
  const sign = t.type === 'income' ? '+' : '−';
  const cls = t.type === 'income' ? 'income' : 'expense';
  const dateFmt = new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR');
  return `
    <div class="tx-row">
      <div class="tx-info">
        <span class="tx-desc">${escapeHTML(t.desc)}</span>
        <span class="tx-meta">${escapeHTML(t.category)} · ${dateFmt}</span>
      </div>
      <span class="tx-amount ${cls}">${sign} ${formatBRL2(t.value)}</span>
    </div>
  `;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ================= RENDER: LANÇAMENTOS (tabela) ================= */
function renderTxTable() {
  populateFilterCategory();
  const search = document.getElementById('searchTx').value.toLowerCase();
  const type = document.getElementById('filterType').value;
  const category = document.getElementById('filterCategory').value;

  let list = [...DATA.transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (search) list = list.filter(t => t.desc.toLowerCase().includes(search));
  if (type !== 'all') list = list.filter(t => t.type === type);
  if (category !== 'all') list = list.filter(t => t.category === category);

  const tbody = document.getElementById('txTableBody');
  const noData = document.getElementById('noTxData');

  if (list.length === 0) {
    tbody.innerHTML = '';
    noData.style.display = 'block';
    return;
  }
  noData.style.display = 'none';

  tbody.innerHTML = list.map(t => {
    const sign = t.type === 'income' ? '+' : '−';
    const cls = t.type === 'income' ? 'income' : 'expense';
    const dateFmt = new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR');
    return `
      <tr>
        <td>${escapeHTML(t.desc)}</td>
        <td><span class="cat-tag">${escapeHTML(t.category)}</span></td>
        <td>${dateFmt}</td>
        <td class="tx-amount ${cls}">${sign} ${formatBRL2(t.value)}</td>
        <td><button class="del-btn" onclick="deleteTx('${t.id}')">✕</button></td>
      </tr>
    `;
  }).join('');
}

/* ================= RENDER: INVESTIMENTOS ================= */
function renderInvestments() {
  const total = DATA.investments.reduce((s, i) => s + i.value, 0);
  document.getElementById('totalInvestedBig').textContent = formatBRL2(total);

  const typeMap = {};
  DATA.investments.forEach(i => {
    typeMap[i.type] = (typeMap[i.type] || 0) + i.value;
  });
  drawInvestmentChart(document.getElementById('invChart'), typeMap);

  const listEl = document.getElementById('invList');
  if (DATA.investments.length === 0) {
    listEl.innerHTML = '<p class="empty-note">Nenhum investimento cadastrado ainda.</p>';
    return;
  }
  listEl.innerHTML = [...DATA.investments].reverse().map(i => `
    <div class="tx-row">
      <div class="tx-info">
        <span class="tx-desc">${escapeHTML(i.name)}</span>
        <span class="tx-meta">${escapeHTML(i.type)}</span>
      </div>
      <span class="tx-amount income">${formatBRL2(i.value)}</span>
      <button class="del-btn" onclick="deleteInv('${i.id}')">✕</button>
    </div>
  `).join('');
}

/* ================= RENDER: METAS ================= */
function renderGoals() {
  const grid = document.getElementById('goalsGrid');
  const noData = document.getElementById('noGoalData');

  if (DATA.goals.length === 0) {
    grid.innerHTML = '';
    noData.style.display = 'block';
    return;
  }
  noData.style.display = 'none';

  grid.innerHTML = DATA.goals.map(g => {
    const pct = Math.min(100, (g.current / g.target) * 100);
    return `
      <div class="goal-card">
        <h4 class="goal-name">${escapeHTML(g.name)}</h4>
        <div class="goal-amounts">${formatBRL2(g.current)} de ${formatBRL2(g.target)} · ${pct.toFixed(0)}%</div>
        <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
        <div style="display:flex; gap:8px;">
          <button class="btn-secondary" style="margin:0; flex:1;" onclick="openGoalAdd('${g.id}')">+ Guardar</button>
          <button class="del-btn" onclick="deleteGoal('${g.id}')">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

/* ================= RENDER: CONFIG ================= */
function renderConfig() {
  document.getElementById('expectedIncome').value = DATA.config.expectedIncome || '';
  document.getElementById('reservePercent').value = DATA.config.reservePercent || 0;
}

/* ================= RENDER ALL ================= */
function renderAll() {
  updateMonthLabel();
  renderDashboard();
  renderTxTable();
  renderInvestments();
  renderGoals();
  renderConfig();
  populateCategorySelect();
}

/* ================= INIT ================= */
document.getElementById('txDate').value = todayISO();
renderAll();
