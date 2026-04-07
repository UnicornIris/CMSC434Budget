/**
 * Reports — same localStorage as Activity: budget-transactions, budget-income
 * Charts: spending, income, or both; pie “split” = totals for the range.
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

const COLOR_INCOME = '#1e7a4a';
const COLOR_INCOME_SOFT = 'rgba(30, 122, 74, 0.88)';
const COLOR_SPEND = '#4f3a63';
const COLOR_SPEND_SOFT = 'rgba(79, 58, 99, 0.88)';

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

function aggregateMonthlyYearEntries(entries, year) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = Array(12).fill(0);
    entries.forEach(t => {
        const d = new Date(t.date + 'T12:00:00');
        if (!Number.isNaN(d.getTime()) && d.getFullYear() === year) {
            months[d.getMonth()] += Number(t.amount) || 0;
        }
    });
    return { labels: monthNames, data: months };
}

function aggregateLast7DaysEntries(entries) {
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = formatYMD(d);
        const sum = entries.filter(t => t.date === key).reduce((s, t) => s + (Number(t.amount) || 0), 0);
        labels.push(d.getMonth() + 1 + '/' + d.getDate());
        data.push(sum);
    }
    return { labels, data };
}

function aggregateCurrentWeekEntries(entries) {
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
        data[i] = entries.filter(t => t.date === key).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    }
    return { labels, data };
}

function aggregateByYearEntries(entries) {
    const map = {};
    entries.forEach(t => {
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

function mergeYearlySeries(expenses, income) {
    const e = aggregateByYearEntries(expenses);
    const inc = aggregateByYearEntries(income);
    const allLabels = [...new Set([...e.labels, ...inc.labels])].sort((a, b) => Number(a) - Number(b));
    const eMap = Object.fromEntries(e.labels.map((l, i) => [l, e.data[i]]));
    const iMap = Object.fromEntries(inc.labels.map((l, i) => [l, inc.data[i]]));
    return {
        labels: allLabels,
        spending: allLabels.map(l => eMap[l] ?? 0),
        income: allLabels.map(l => iMap[l] ?? 0)
    };
}

/** Aligned spending + income series for the selected time range. */
function buildChartData(range) {
    const expenses = loadExpenseTransactions();
    const income = loadIncomeEntries();
    const y = new Date().getFullYear();

    if (range === 'monthly') {
        const s = aggregateMonthlyYearEntries(expenses, y);
        const inc = aggregateMonthlyYearEntries(income, y);
        return { labels: s.labels, spending: s.data, income: inc.data };
    }
    if (range === 'weekly') {
        const s = aggregateCurrentWeekEntries(expenses);
        const inc = aggregateCurrentWeekEntries(income);
        return { labels: s.labels, spending: s.data, income: inc.data };
    }
    if (range === 'yearly') {
        return mergeYearlySeries(expenses, income);
    }
    if (range === 'daily') {
        const s = aggregateLast7DaysEntries(expenses);
        const inc = aggregateLast7DaysEntries(income);
        return { labels: s.labels, spending: s.data, income: inc.data };
    }
    const s = aggregateMonthlyYearEntries(expenses, y);
    const inc = aggregateMonthlyYearEntries(income, y);
    return { labels: s.labels, spending: s.data, income: inc.data };
}

function formatDisplayDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.getMonth() + 1 + '/' + d.getDate();
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
    const typeSelect = document.getElementById('chartType');
    const rangeSelect = document.getElementById('timeRange');
    const metricSelect = document.getElementById('chartMetric');
    if (!typeSelect || !rangeSelect) return;

    const type = typeSelect.value;
    const range = rangeSelect.value;
    const metric = metricSelect ? metricSelect.value : 'spending';

    const ctx = document.getElementById('myChart');
    const selected = buildChartData(range);
    if (!ctx || !selected) return;

    if (myChart) myChart.destroy();

    const isPie = type === 'pie';
    const isLine = type === 'line';

    let labels = selected.labels;
    let datasets = [];

    if (isPie && metric === 'compare') {
        const totalInc = selected.income.reduce((a, b) => a + b, 0);
        const totalSp = selected.spending.reduce((a, b) => a + b, 0);
        labels = ['Income (total)', 'Spending (total)'];
        datasets = [
            {
                label: 'Totals for range',
                data: [totalInc, totalSp],
                backgroundColor: [COLOR_INCOME_SOFT, COLOR_SPEND_SOFT],
                borderColor: ['#fff', '#fff'],
                borderWidth: 2,
                hoverOffset: 6
            }
        ];
    } else if (isPie) {
        const data = metric === 'income' ? selected.income : selected.spending;
        const labelCount = labels.length;
        const bgColors = labels.map((_, i) => REPORT_COLORS[i % REPORT_COLORS.length]);
        datasets = [
            {
                label: metric === 'income' ? 'Income' : 'Spending',
                data,
                backgroundColor: bgColors,
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 6
            }
        ];
    } else if (metric === 'compare') {
        datasets = [
            {
                label: 'Income',
                data: selected.income,
                backgroundColor: isLine ? 'rgba(30, 122, 74, 0.2)' : COLOR_INCOME_SOFT,
                borderColor: COLOR_INCOME,
                borderWidth: isLine ? 2 : 0,
                fill: isLine,
                tension: isLine ? 0.35 : 0
            },
            {
                label: 'Spending',
                data: selected.spending,
                backgroundColor: isLine ? 'rgba(79, 58, 99, 0.15)' : COLOR_SPEND_SOFT,
                borderColor: COLOR_SPEND,
                borderWidth: isLine ? 2 : 0,
                fill: isLine,
                tension: isLine ? 0.35 : 0
            }
        ];
    } else {
        const data = metric === 'income' ? selected.income : selected.spending;
        const bgColors = isLine
            ? 'rgba(79, 58, 99, 0.15)'
            : metric === 'income'
              ? COLOR_INCOME_SOFT
              : REPORT_COLORS[0];
        const borderColor = isLine ? (metric === 'income' ? COLOR_INCOME : COLOR_SPEND) : metric === 'income' ? COLOR_INCOME : COLOR_SPEND;
        datasets = [
            {
                label: metric === 'income' ? 'Income' : 'Spending',
                data,
                backgroundColor: bgColors,
                borderColor: isLine ? borderColor : borderColor,
                borderWidth: isLine ? 2 : 0,
                fill: isLine,
                tension: isLine ? 0.35 : 0
            }
        ];
    }

    const labelCount = labels.length;
    const legendDisplay = isPie ? true : datasets.length > 1 || metric !== 'spending';

    myChart = new Chart(ctx, {
        type,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: legendDisplay,
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
                            const prefix = ctx.dataset.label ? ctx.dataset.label + ': ' : '';
                            return (
                                prefix +
                                (typeof v === 'number'
                                    ? '$' +
                                      v.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                      })
                                    : String(v))
                            );
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

const tr = document.getElementById('timeRange');
const ct = document.getElementById('chartType');
const cm = document.getElementById('chartMetric');
if (tr) tr.addEventListener('change', refreshReports);
if (ct) ct.addEventListener('change', refreshReports);
if (cm) cm.addEventListener('change', refreshReports);

window.addEventListener('load', refreshReports);
window.addEventListener('pageshow', e => {
    if (e.persisted) refreshReports();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshReports();
});
