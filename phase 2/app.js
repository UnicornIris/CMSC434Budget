/**
 * Finance App - Phase 2
 * Period summary, spent today, income logging, period filter
 */

const STORAGE_KEY = 'budget-transactions';
const STORAGE_KEY_INCOME = 'budget-income';
const STORAGE_KEY_PERIOD = 'budget-period';
const CATEGORIES = ['Food', 'Coffee', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'];
const INCOME_SOURCES = ['Salary', 'Freelance', 'Side job', 'Gift', 'Refund', 'Other'];

function getDefaultTransactions() {
    const today = formatDateForStorage(new Date());
    const d = new Date();
    const weekAgo = new Date(d);
    weekAgo.setDate(d.getDate() - 5);
    return [
        { id: '1', name: 'Coffee', amount: 5.50, category: 'Coffee', date: today },
        { id: '2', name: 'Lunch', amount: 12.99, category: 'Food', date: today },
        { id: '3', name: 'Uber', amount: 8.25, category: 'Transport', date: today },
        { id: '4', name: 'Groceries', amount: 45.00, category: 'Shopping', date: formatDateForStorage(weekAgo) },
        { id: '5', name: 'Netflix', amount: 15.99, category: 'Bills', date: formatDateForStorage(d) }
    ];
}

function getDefaultIncome() {
    const d = new Date();
    const y = d.getFullYear(), m = d.getMonth();
    const p = n => String(n).padStart(2, '0');
    return [
        { id: generateId(), name: 'Salary', date: `${y}-${p(m + 1)}-01`, amount: 2500, source: 'Salary' },
        { id: generateId(), name: 'Freelance', date: `${y}-${p(m + 1)}-15`, amount: 1000, source: 'Freelance' }
    ];
}

function normalizeIncomeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const amount = Math.max(0, parseFloat(raw.amount) || 0);
    const date = raw.date || formatDateForStorage(new Date());
    const source = INCOME_SOURCES.includes(raw.source) ? raw.source : 'Other';
    return {
        id: raw.id || generateId(),
        name: (raw.name && String(raw.name).trim()) || 'Income',
        amount,
        date,
        source
    };
}

function loadTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return getDefaultTransactions();
}

function saveTransactions(tx) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tx));
}

function loadIncome() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_INCOME);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return arr.map(normalizeIncomeEntry).filter(Boolean);
        }
    } catch (e) {}
    return getDefaultIncome();
}

function saveIncome(income) {
    localStorage.setItem(STORAGE_KEY_INCOME, JSON.stringify(income));
}

function loadSelectedPeriod() {
    return localStorage.getItem(STORAGE_KEY_PERIOD) || 'month';
}

function saveSelectedPeriod(period) {
    localStorage.setItem(STORAGE_KEY_PERIOD, period);
}

function formatDateForStorage(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatCurrency(amt) {
    return '$' + Number(amt).toFixed(2);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getDateRangeForPeriod(period) {
    const end = new Date();
    const start = new Date();
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    if (period === '7') start.setDate(end.getDate() - 6);
    else if (period === '14') start.setDate(end.getDate() - 13);
    else if (period === '30') start.setDate(end.getDate() - 29);
    else start.setDate(1);
    return { start, end };
}

function formatPeriodLabel(period) {
    const { start, end } = getDateRangeForPeriod(period);
    const fmt = d => (d.getMonth() + 1) + '/' + d.getDate();
    if (period === 'month') return 'This month';
    return fmt(start) + ' – ' + fmt(end);
}

function formatPeriodContextPhrase(period) {
    if (period === 'month') return 'this month';
    if (period === '7') return 'the last 7 days';
    if (period === '14') return 'the last 14 days';
    if (period === '30') return 'the last 30 days';
    return 'the selected range';
}

function isDateInRange(dateStr, start, end) {
    const d = new Date(dateStr);
    d.setHours(12, 0, 0, 0);
    return d >= start && d <= end;
}

function getFilteredTotals() {
    const { start, end } = getDateRangeForPeriod(selectedPeriod);
    const income = incomeEntries
        .filter(i => isDateInRange(i.date, start, end))
        .reduce((sum, i) => sum + i.amount, 0);
    const expenses = transactions
        .filter(t => isDateInRange(t.date, start, end))
        .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses };
}

function getFilteredIncomeEntries() {
    const { start, end } = getDateRangeForPeriod(selectedPeriod);
    return incomeEntries
        .filter(i => isDateInRange(i.date, start, end))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function formatShortDateDisplay(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
}

let transactions = loadTransactions();
let incomeEntries = loadIncome();
let selectedPeriod = loadSelectedPeriod();
let editingTransactionId = null;
let editingIncomeId = null;

const spentTodayCard = document.getElementById('spent-today-card');
const spentTodayAmount = document.getElementById('spent-today-amount');
const todayTransactionsView = document.getElementById('today-transactions-view');
const todayTransactionsList = document.getElementById('today-transactions-list');
const backBtn = document.getElementById('back-btn');
const editModal = document.getElementById('edit-modal');
const editName = document.getElementById('edit-name');
const editAmount = document.getElementById('edit-amount');
const editCategory = document.getElementById('edit-category');
const editSaveBtn = document.getElementById('edit-save-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const periodCard = document.getElementById('period-card');
const periodLabel = document.getElementById('period-label');
const periodModal = document.getElementById('period-modal');
const balanceAmountEl = document.getElementById('balance-amount');
const statIncomeEl = document.getElementById('stat-income');
const statExpensesEl = document.getElementById('stat-expenses');
const statNetEl = document.getElementById('stat-net');
const barIncomeEl = document.getElementById('bar-income');
const barExpensesEl = document.getElementById('bar-expenses');
const progressPeriodContextEl = document.getElementById('progress-period-context');
const incomeEntriesView = document.getElementById('income-entries-view');
const incomeEntriesList = document.getElementById('income-entries-list');
const incomeListBackBtn = document.getElementById('income-list-back-btn');
const incomeListAddBtn = document.getElementById('income-list-add-btn');
const incomeListPeriodLabel = document.getElementById('income-list-period-label');
const incomeModal = document.getElementById('income-modal');
const btnOpenIncomeModal = document.getElementById('btn-open-income-modal');
const btnOpenIncomeList = document.getElementById('btn-open-income-list');
const incomeSaveBtn = document.getElementById('income-save-btn');
const incomeCancelBtn = document.getElementById('income-cancel-btn');

function populateIncomeSourceSelect() {
    const sel = document.getElementById('income-source');
    if (!sel) return;
    sel.innerHTML = INCOME_SOURCES.map(s => `<option value="${s}">${s}</option>`).join('');
}

function getTodayTransactions() {
    const today = formatDateForStorage(new Date());
    return transactions.filter(t => t.date === today);
}

function computeSpentToday() {
    return getTodayTransactions().reduce((sum, t) => sum + t.amount, 0);
}

function updateSpentTodayDisplay() {
    if (spentTodayAmount) spentTodayAmount.textContent = formatCurrency(computeSpentToday());
}

function updateProgressSummary() {
    const { income, expenses } = getFilteredTotals();
    const net = income - expenses;
    const maxVal = Math.max(income, expenses, 1);
    const incomePct = Math.round((income / maxVal) * 100);
    const expensesPct = Math.round((expenses / maxVal) * 100);

    if (balanceAmountEl) balanceAmountEl.textContent = formatCurrency(net);
    if (statIncomeEl) statIncomeEl.textContent = formatCurrency(income);
    if (statExpensesEl) statExpensesEl.textContent = formatCurrency(expenses);
    if (statNetEl) {
        statNetEl.textContent = formatCurrency(net);
        statNetEl.classList.remove('stat-net-negative', 'stat-net-positive');
        if (net < 0) statNetEl.classList.add('stat-net-negative');
        else if (net > 0) statNetEl.classList.add('stat-net-positive');
    }
    if (barIncomeEl) barIncomeEl.style.width = incomePct + '%';
    if (barExpensesEl) barExpensesEl.style.width = expensesPct + '%';
    if (progressPeriodContextEl) progressPeriodContextEl.textContent = formatPeriodContextPhrase(selectedPeriod);
}

function renderTodayTransactionsList() {
    if (!todayTransactionsList) return;
    const today = getTodayTransactions();
    todayTransactionsList.innerHTML = '';

    if (today.length === 0) {
        todayTransactionsList.innerHTML = '<li class="transaction-item transaction-empty">No transactions today.</li>';
        return;
    }

    today.forEach(t => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.dataset.id = t.id;
        const catOptions = CATEGORIES.map(c => `<option value="${c}" ${c === t.category ? 'selected' : ''}>${c}</option>`).join('');
        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-name">${escapeHtml(t.name)}</span>
                <select class="transaction-category" data-id="${t.id}">${catOptions}</select>
            </div>
            <span class="transaction-amount">${formatCurrency(t.amount)}</span>
            <div class="transaction-actions">
                <button type="button" class="btn-edit" data-action="edit" data-id="${t.id}">Edit</button>
                <button type="button" class="btn-delete" data-action="delete" data-id="${t.id}">Delete</button>
            </div>
        `;
        todayTransactionsList.appendChild(li);
    });

    todayTransactionsList.querySelectorAll('.transaction-category').forEach(sel => {
        sel.addEventListener('change', () => changeCategory(sel.dataset.id, sel.value));
    });
    todayTransactionsList.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(btn.dataset.id);
        });
    });
    todayTransactionsList.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTransaction(btn.dataset.id);
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openEditModal(id) {
    const t = transactions.find(x => x.id === id);
    if (!t || !editModal) return;
    editingTransactionId = id;
    editName.value = t.name;
    editAmount.value = t.amount;
    editCategory.value = t.category;
    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editingTransactionId = null;
    if (editModal) editModal.classList.add('hidden');
}

function saveEditedTransaction() {
    if (!editingTransactionId) return;
    const t = transactions.find(x => x.id === editingTransactionId);
    if (!t) return;

    const name = editName.value.trim() || t.name;
    const amount = Math.max(0, parseFloat(editAmount.value) || 0);
    const category = editCategory.value;

    t.name = name;
    t.amount = amount;
    t.category = category;
    saveTransactions(transactions);

    renderTodayTransactionsList();
    updateSpentTodayDisplay();
    updateProgressSummary();
    closeEditModal();
}

function changeCategory(id, newCategory) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    t.category = newCategory;
    saveTransactions(transactions);
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions(transactions);
    renderTodayTransactionsList();
    updateSpentTodayDisplay();
    updateProgressSummary();
}

function showTodayTransactionsView() {
    renderTodayTransactionsList();
    if (todayTransactionsView) todayTransactionsView.classList.remove('hidden');
}

function hideTodayTransactionsView() {
    if (todayTransactionsView) todayTransactionsView.classList.add('hidden');
}

function openIncomeModal(existingId) {
    if (!incomeModal) return;
    editingIncomeId = existingId || null;
    const titleEl = document.getElementById('income-modal-title');
    const nameEl = document.getElementById('income-name');
    const amountEl = document.getElementById('income-amount');
    const dateEl = document.getElementById('income-date');
    const sourceEl = document.getElementById('income-source');
    if (existingId) {
        const e = incomeEntries.find(x => x.id === existingId);
        if (!e) return;
        if (titleEl) titleEl.textContent = 'Edit income';
        if (nameEl) nameEl.value = e.name;
        if (amountEl) amountEl.value = String(e.amount);
        if (dateEl) dateEl.value = e.date;
        if (sourceEl) sourceEl.value = INCOME_SOURCES.includes(e.source) ? e.source : 'Other';
    } else {
        if (titleEl) titleEl.textContent = 'Add income';
        if (nameEl) nameEl.value = '';
        if (amountEl) amountEl.value = '';
        if (dateEl) dateEl.value = formatDateForStorage(new Date());
        if (sourceEl) sourceEl.value = 'Salary';
    }
    incomeModal.classList.remove('hidden');
}

function closeIncomeModal() {
    editingIncomeId = null;
    if (incomeModal) incomeModal.classList.add('hidden');
}

function saveIncomeFromModal() {
    const nameEl = document.getElementById('income-name');
    const amountEl = document.getElementById('income-amount');
    const dateEl = document.getElementById('income-date');
    const sourceEl = document.getElementById('income-source');
    const name = (nameEl && nameEl.value.trim()) || 'Income';
    const amount = Math.max(0, parseFloat(amountEl && amountEl.value) || 0);
    const dateStr = (dateEl && dateEl.value) || formatDateForStorage(new Date());
    const source = (sourceEl && sourceEl.value) || 'Other';
    if (amount <= 0) {
        alert('Please enter a positive amount.');
        return;
    }
    if (editingIncomeId) {
        const e = incomeEntries.find(x => x.id === editingIncomeId);
        if (e) {
            e.name = name;
            e.amount = amount;
            e.date = dateStr;
            e.source = source;
        }
    } else {
        incomeEntries.push({
            id: generateId(),
            name,
            amount,
            date: dateStr,
            source
        });
    }
    saveIncome(incomeEntries);
    closeIncomeModal();
    updateProgressSummary();
    renderIncomeEntriesList();
}

function deleteIncomeEntry(id) {
    incomeEntries = incomeEntries.filter(i => i.id !== id);
    saveIncome(incomeEntries);
    updateProgressSummary();
    renderIncomeEntriesList();
}

function renderIncomeEntriesList() {
    if (!incomeEntriesList) return;
    const rows = getFilteredIncomeEntries();
    incomeEntriesList.innerHTML = '';
    if (rows.length === 0) {
        incomeEntriesList.innerHTML = '<li class="transaction-item transaction-empty">No income entries in this period.</li>';
        return;
    }
    rows.forEach(i => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.dataset.id = i.id;
        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-name">${escapeHtml(i.name)}</span>
                <span class="income-entry-meta">${escapeHtml(i.source)} · ${formatShortDateDisplay(i.date)}</span>
            </div>
            <span class="transaction-amount-income">+${formatCurrency(i.amount)}</span>
            <div class="transaction-actions">
                <button type="button" class="btn-edit" data-income-action="edit" data-id="${escapeHtml(i.id)}">Edit</button>
                <button type="button" class="btn-delete" data-income-action="delete" data-id="${escapeHtml(i.id)}">Delete</button>
            </div>
        `;
        incomeEntriesList.appendChild(li);
    });
    incomeEntriesList.querySelectorAll('[data-income-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openIncomeModal(btn.dataset.id);
        });
    });
    incomeEntriesList.querySelectorAll('[data-income-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteIncomeEntry(btn.dataset.id);
        });
    });
}

function showIncomeEntriesView() {
    if (incomeListPeriodLabel) {
        incomeListPeriodLabel.textContent = 'Showing: ' + formatPeriodLabel(selectedPeriod);
    }
    renderIncomeEntriesList();
    if (incomeEntriesView) incomeEntriesView.classList.remove('hidden');
}

function hideIncomeEntriesView() {
    if (incomeEntriesView) incomeEntriesView.classList.add('hidden');
}

if (spentTodayCard) {
    spentTodayCard.addEventListener('click', showTodayTransactionsView);
    spentTodayCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showTodayTransactionsView();
        }
    });
}
if (backBtn) backBtn.addEventListener('click', hideTodayTransactionsView);
if (editSaveBtn) editSaveBtn.addEventListener('click', saveEditedTransaction);
if (editCancelBtn) editCancelBtn.addEventListener('click', closeEditModal);

if (btnOpenIncomeModal) btnOpenIncomeModal.addEventListener('click', () => openIncomeModal(null));
if (btnOpenIncomeList) btnOpenIncomeList.addEventListener('click', showIncomeEntriesView);
if (incomeListBackBtn) incomeListBackBtn.addEventListener('click', hideIncomeEntriesView);
if (incomeListAddBtn) incomeListAddBtn.addEventListener('click', () => openIncomeModal(null));
if (incomeSaveBtn) incomeSaveBtn.addEventListener('click', saveIncomeFromModal);
if (incomeCancelBtn) incomeCancelBtn.addEventListener('click', closeIncomeModal);

function openPeriodModal() {
    if (periodModal) periodModal.classList.remove('hidden');
}

function closePeriodModal() {
    if (periodModal) periodModal.classList.add('hidden');
}

function selectPeriod(period) {
    selectedPeriod = period;
    saveSelectedPeriod(period);
    if (periodLabel) periodLabel.textContent = formatPeriodLabel(period);
    updateProgressSummary();
    closePeriodModal();
    if (incomeEntriesView && !incomeEntriesView.classList.contains('hidden')) {
        if (incomeListPeriodLabel) {
            incomeListPeriodLabel.textContent = 'Showing: ' + formatPeriodLabel(selectedPeriod);
        }
        renderIncomeEntriesList();
    }
}

if (periodCard) {
    periodCard.addEventListener('click', openPeriodModal);
    periodCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPeriodModal();
        }
    });
}

if (periodModal) {
    periodModal.querySelectorAll('.period-option').forEach(btn => {
        btn.addEventListener('click', () => selectPeriod(btn.dataset.period));
    });
    const closeBtn = document.getElementById('period-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closePeriodModal);
}

document.addEventListener('DOMContentLoaded', () => {
    populateIncomeSourceSelect();
    updateSpentTodayDisplay();
    if (periodLabel) periodLabel.textContent = formatPeriodLabel(selectedPeriod);
    updateProgressSummary();
});
