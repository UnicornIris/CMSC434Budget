/**
 * Reports — uses same localStorage as Activity (app.js): budget-transactions, budget-income
 */
let myChart;

const STORAGE_KEY = 'budget-transactions';
const STORAGE_KEY_INCOME = 'budget-income';

const REPORT_COLORS = [
    '#4f3a63',
    '#7b6394',
    '#9b7bb8',
    '#1e7a4a',
    '#2ecc71',
    '#b03028',
    '#e74c3c',
    '#5c4172',
    '#a894c4',
    '#4a3d55',
    '#cfc4dc',
    '#8e7a9e'
];

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function loadExpenseTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        }
    } catch (e) {}
    return [];
}

function normalizeIncomeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
        name: (raw.name && String(raw.name).trim()) || 'Income',
        amount: Math.max(0, parseFloat(raw.amount) || 0),
        date: raw.date || formatYMD(new Date()),
        source: raw.source || 'Other'
    };
}

function loadIncomeEntries() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_INCOME);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return arr.map(normalizeIncomeEntry).filter(Boolean);
        }
    } catch (e) {}
    return [];
}

function aggregateMonthlyYear(expenses, year) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = Array(12).fill(0);
    expenses.forEach(t => {
        const d = new Date(t.date + 'T12:00:00');
        if (!Number.isNaN(d.getTime()) && d.getFullYear() === year) {
            months[d.getMonth()] += Number(t.amount) || 0;
        }
    });
    return { labels: monthNames, data: months };
}

function aggregateLast7Days(expenses) {
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = formatYMD(d);
        const sum = expenses.filter(t => t.date === key).reduce((s, t) => s + (Number(t.amount) || 0), 0);
        labels.push((d.getMonth() + 1) + '/' + d.getDate());
        data.push(sum);
    }
    return { labels, data };
}

function aggregateCurrentWeek(expenses) {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = Array(7).fill(0);
    const now = new Date();
    const start = new Date(now);
    start.setHours(12, 0, 0, 0);
    start.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = formatYMD(d);
        data[i] = expenses.filter(t => t.date === key).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    }
    return { labels, data };
}

function aggregateByYear(expenses) {
    const map = {};
    expenses.forEach(t => {
        const d = new Date(t.date + 'T12:00:00');
        if (Number.isNaN(d.getTime())) return;
        const y = d.getFullYear();
        map[y] = (map[y] || 0) + (Number(t.amount) || 0);
    });
    const years = Object.keys(map)
        .map(Number)
        .sort((a, b) => a - b);
    if (years.length === 0) {
        const y = new Date().getFullYear();
        return { labels: [String(y - 2), String(y - 1), String(y)], data: [0, 0, 0] };
    }
    return { labels: years.map(String), data: years.map(y => map[y]) };
}

/** Build chart series from saved expenses only (spending). */
function buildChartData(range) {
    const expenses = loadExpenseTransactions();
    const y = new Date().getFullYear();

    if (range === 'monthly') {
        return aggregateMonthlyYear(expenses, y);
    }
    if (range === 'weekly') {
        return aggregateCurrentWeek(expenses);
    }
    if (range === 'yearly') {
        return aggregateByYear(expenses);
    }
    if (range === 'daily') {
        return aggregateLast7Days(expenses);
    }
    return aggregateMonthlyYear(expenses, y);
}

function formatDisplayDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return (d.getMonth() + 1) + '/' + d.getDate();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getRecentLedger(limit) {
    const expenses = loadExpenseTransactions();
    const income = loadIncomeEntries();
    const rows = [];

    expenses.forEach(t => {
        rows.push({
            name: t.name || 'Expense',
            amount: -Math.abs(Number(t.amount) || 0),
            category: t.category || 'Other',
            date: t.date,
            sort: t.date || ''
        });
    });

    income.forEach(i => {
        rows.push({
            name: i.name || 'Income',
            amount: Math.abs(Number(i.amount) || 0),
            category: i.source || 'Income',
            date: i.date,
            sort: i.date || ''
        });
    });

    rows.sort((a, b) => b.sort.localeCompare(a.sort));
    return rows.slice(0, limit);
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    const hint = document.getElementById('reports-activity-hint');
    if (!list) return;

    const rows = getRecentLedger(40);
    list.innerHTML = '';

    if (hint) {
        hint.textContent =
            rows.length === 0
                ? 'No transactions yet. Add expenses or income on Activity.'
                : 'Newest first — same data as Activity (this device).';
    }

    if (rows.length === 0) {
        list.innerHTML = '<li class="transaction-item transaction-empty">No transactions yet.</li>';
        return;
    }

    rows.forEach(t => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        const isIncome = t.amount > 0;
        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-name">${escapeHtml(t.name)}</span>
                <span class="income-entry-meta">${formatDisplayDate(t.date)} · ${escapeHtml(t.category)}</span>
            </div>
            <span class="${isIncome ? 'transaction-amount-income' : 'transaction-amount'}">${isIncome ? '+' : '−'}$${Math.abs(t.amount).toFixed(2)}</span>
        `;
        list.appendChild(li);
    });
}

function chartTickColor() {
    return '#4a3d55';
}

function renderChart() {
    const type = document.getElementById('chartType').value;
    const range = document.getElementById('timeRange').value;
    const ctx = document.getElementById('myChart');
    const selected = buildChartData(range);
    if (!ctx || !selected) return;

    if (myChart) myChart.destroy();

    const isPie = type === 'pie';
    const isLine = type === 'line';
    const labelCount = selected.labels.length;
    const bgColors = isPie
        ? selected.labels.map((_, i) => REPORT_COLORS[i % REPORT_COLORS.length])
        : isLine
            ? 'rgba(79, 58, 99, 0.15)'
            : REPORT_COLORS[0];

    const borderColor = isLine ? '#4f3a63' : isPie ? '#fff' : '#4f3a63';

    myChart = new Chart(ctx, {
        type,
        data: {
            labels: selected.labels,
            datasets: [
                {
                    label: 'Spending',
                    data: selected.data,
                    backgroundColor: bgColors,
                    borderColor: isPie ? '#fff' : borderColor,
                    borderWidth: isPie ? 2 : isLine ? 2 : 0,
                    fill: isLine,
                    tension: isLine ? 0.35 : 0,
                    hoverOffset: isPie ? 6 : 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: isPie,
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        padding: 10,
                        font: { size: 11, family: 'system-ui, sans-serif' },
                        color: chartTickColor()
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(31, 18, 36, 0.92)',
                    titleFont: { size: 13 },
                    bodyFont: { size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label(ctx) {
                            const v = ctx.raw;
                            return typeof v === 'number' ? ` $${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ` ${v}`;
                        }
                    }
                }
            },
            scales: isPie
                ? { x: { display: false }, y: { display: false } }
                : {
                      x: {
                          grid: { display: false },
                          ticks: {
                              maxRotation: 45,
                              minRotation: 0,
                              font: { size: 10 },
                              color: chartTickColor(),
                              autoSkip: true,
                              maxTicksLimit: labelCount > 10 ? 8 : 12
                          }
                      },
                      y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(74, 61, 85, 0.12)' },
                          ticks: {
                              font: { size: 10 },
                              color: chartTickColor(),
                              callback(v) {
                                  if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'k';
                                  return '$' + v;
                              }
                          }
                      }
                  }
        }
    });
}

function refreshReports() {
    renderChart();
    renderTransactions();
}

document.getElementById('chartType').addEventListener('change', refreshReports);
document.getElementById('timeRange').addEventListener('change', refreshReports);

window.addEventListener('load', refreshReports);
window.addEventListener('pageshow', (e) => {
    if (e.persisted) refreshReports();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshReports();
});