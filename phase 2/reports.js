let myChart;

// Sample Data
const dataSets = {
    monthly: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May","Jun","July","Aug","Sept",
            "Nov","Dec","Jan","Feb", "Mar", "Apr"],
        data: [3000, 3500, 4500, 1200, 3320,3000, 3500, 
            4500, 1200, 3320,1234, 5555, 767, 3232, 5545, 7676]
    },
    weekly: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [50, 70, 40, 90, 60, 50, 70]
    },
    yearly: {
        labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
        data: [35000, 4432, 39000, 25000, 33000,14000]
    },
    daily: {
        labels: ["8AM", "12PM", "4PM", "8PM"],
        data: [10, 25, 15, 30]
    }
};

const transactions = [
    { name: "Chipotle", amount: -12.50, category: "Food", date: "Apr 5" },
    { name: "Salary", amount: 1200, category: "Income", date: "Apr 4" },
    { name: "Uber", amount: -18.20, category: "Transport", date: "Apr 3" },
    { name: "Netflix", amount: -9.99, category: "Entertainment", date: "Apr 2" }
];

function renderTransactions() {
    const list = document.getElementById("transactions-list");
    list.innerHTML = "";

    if (transactions.length === 0) {
        list.innerHTML = `<li class="transaction-item transaction-empty">No transactions yet</li>`;
        return;
    }

    transactions.forEach(t => {
        const li = document.createElement("li");
        li.className = "transaction-item";

        const isIncome = t.amount > 0;

        li.innerHTML = `
    <div class="transaction-info">
        <strong class="transaction-name">${t.name}</strong>
        <span class="income-entry-meta">${t.date} • ${t.category}</span>
    </div>

    <div class="${isIncome ? 'transaction-amount-income' : 'transaction-amount'}">
        <strong>${isIncome ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}</strong>
    </div>
`;

        list.appendChild(li);
    });
}

function renderChart() {
    const type = document.getElementById("chartType").value;
    const range = document.getElementById("timeRange").value;

    const ctx = document.getElementById("myChart");
    const selected = dataSets[range];

    if (myChart) myChart.destroy();

    const isPie = type === "pie";

    const colors = isPie
        ? [
            "#6C5CE7",
            "#A29BFE",
            "#FD79A8",
            "#FAB1A0",
            "#00CEC9",
            "#55EFC4",
            "#FFEAA7",
            "#81ECEC",
            "#74B9FF",
            "#E17055",
            "#00B894",
            "#D63031",
            "#0984E3",
            "#6C5CE7",
            "#B2BEC3"
        ]
        : "#4f3a63";

    myChart = new Chart(ctx, {
        type: type,
        data: {
            labels: selected.labels,
            datasets: [{
                label: "Spending",
                data: selected.data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

document.getElementById("chartType").addEventListener("change", renderChart);
document.getElementById("timeRange").addEventListener("change", renderChart);

window.onload = () => {
    renderChart();
    renderTransactions();
};
