/**
 * Finance App - Phase 2
 * ANANT's tasks: Money Spent Today, Toggling Views, Filtering by Period
 */

const STORAGE_KEY = 'budget-transactions';
const STORAGE_KEY_INCOME = 'budget-income';
const STORAGE_KEY_PERIOD = 'budget-period';
const CATEGORIES = ['Food', 'Coffee', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'];

// Sample expense transactions
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

// Sample income entries with dates
function getDefaultIncome() {
    const d = new Date();
    const y = d.getFullYear(), m = d.getMonth();
    return [
        { date: `${y}-${String(m + 1).padStart(2, '0')}-01`, amount: 2500 },
        { date: `${y}-${String(m + 1).padStart(2, '0')}-15`, amount: 1000 }
    ];
}

function loadTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {}
    return getDefaultTransactions();
}

function saveTransactions(tx) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tx));
}

function loadIncome() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_INCOME);
        if (raw) return JSON.parse(raw);
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

// --- Period filtering ---
function getDateRangeForPeriod(period) {
    const end = new Date();
    const start = new Date();
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    if (period === '7') {
        start.setDate(end.getDate() - 6);
    } else if (period === '14') {
        start.setDate(end.getDate() - 13);
    } else if (period === '30') {
        start.setDate(end.getDate() - 29);
    } else {
        // This Month
        start.setDate(1);
    }
    return { start, end };
}

function formatPeriodLabel(period) {
    const { start, end } = getDateRangeForPeriod(period);
    const fmt = d => (d.getMonth() + 1) + '/' + d.getDate();
    if (period === 'month') return 'This Month';
    return fmt(start) + ' - ' + fmt(end);
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

// --- State ---
let transactions = loadTransactions();
let incomeEntries = loadIncome();
let selectedPeriod = loadSelectedPeriod();
let progressChart = null;
let editingTransactionId = null;

// --- DOM ---
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
const legendIncome = document.getElementById('legend-income');
const legendExpenses = document.getElementById('legend-expenses');
const periodCard = document.getElementById('period-card');
const periodLabel = document.getElementById('period-label');
const periodModal = document.getElementById('period-modal');

// --- Today's transactions ---
function getTodayTransactions() {
    const today = formatDateForStorage(new Date());
    return transactions.filter(t => t.date === today);
}

function computeSpentToday() {
    return getTodayTransactions().reduce((sum, t) => sum + t.amount, 0);
}

function updateSpentTodayDisplay() {
    spentTodayAmount.textContent = formatCurrency(computeSpentToday());
}

function renderTodayTransactionsList() {
    const today = getTodayTransactions();
    todayTransactionsList.innerHTML = '';

    if (today.length === 0) {
        todayTransactionsList.innerHTML = '<li class="transaction-item" style="text-align:center;color:#666;">No transactions today.</li>';
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
                <button class="btn-edit" data-action="edit" data-id="${t.id}">Edit</button>
                <button class="btn-delete" data-action="delete" data-id="${t.id}">Delete</button>
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
    if (!t) return;
    editingTransactionId = id;
    editName.value = t.name;
    editAmount.value = t.amount;
    editCategory.value = t.category;
    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editingTransactionId = null;
    editModal.classList.add('hidden');
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
    updateChartWithFilteredData();
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
    updateChartWithFilteredData();
}

// --- Spent Today tap -> show today's transactions ---
function showTodayTransactionsView() {
    renderTodayTransactionsList();
    todayTransactionsView.classList.remove('hidden');
}

function hideTodayTransactionsView() {
    todayTransactionsView.classList.add('hidden');
}

spentTodayCard.addEventListener('click', showTodayTransactionsView);
spentTodayCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showTodayTransactionsView();
    }
});
backBtn.addEventListener('click', hideTodayTransactionsView);
editSaveBtn.addEventListener('click', saveEditedTransaction);
editCancelBtn.addEventListener('click', closeEditModal);

// --- Progress Chart & Toggling ---
function updateChartWithFilteredData() {
    const { income, expenses } = getFilteredTotals();
    if (progressChart && progressChart.data && progressChart.data.datasets) {
        progressChart.data.datasets[0].data = [income, null];
        progressChart.data.datasets[1].data = [null, expenses];
        progressChart.update();
    }
}

function initProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { income, expenses } = getFilteredTotals();

    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [
                {
                    label: 'Income',
                    data: [income, null],
                    backgroundColor: 'rgba(46, 204, 113, 0.8)',
                    borderColor: 'rgb(46, 204, 113)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: [null, expenses],
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: 'rgb(231, 76, 60)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ctx.raw != null ? formatCurrency(ctx.raw) : ''
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => formatCurrency(v)
                    }
                }
            }
        }
    });
}

function toggleDatasetVisibility(datasetIndex) {
    if (!progressChart || !progressChart.data.datasets[datasetIndex]) return;
    const meta = progressChart.getDatasetMeta(datasetIndex);
    meta.hidden = !meta.hidden;
    progressChart.update();
    const legendEl = datasetIndex === 0 ? legendIncome : legendExpenses;
    legendEl.classList.toggle('inactive', meta.hidden);
}

legendIncome.addEventListener('click', () => toggleDatasetVisibility(0));
legendExpenses.addEventListener('click', () => toggleDatasetVisibility(1));

// --- Period filtering ---
function openPeriodModal() {
    periodModal.classList.remove('hidden');
}

function closePeriodModal() {
    periodModal.classList.add('hidden');
}

function selectPeriod(period) {
    selectedPeriod = period;
    saveSelectedPeriod(period);
    periodLabel.textContent = formatPeriodLabel(period);
    updateChartWithFilteredData();
    closePeriodModal();
}

periodCard.addEventListener('click', openPeriodModal);
periodCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPeriodModal();
    }
});

periodModal.querySelectorAll('.period-option').forEach(btn => {
    btn.addEventListener('click', () => selectPeriod(btn.dataset.period));
});
document.getElementById('period-close-btn').addEventListener('click', closePeriodModal);

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    updateSpentTodayDisplay();
    periodLabel.textContent = formatPeriodLabel(selectedPeriod);
    initProgressChart();
});
