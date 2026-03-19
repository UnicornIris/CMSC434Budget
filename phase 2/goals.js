const GOALS_KEY = "budget-goals";

function loadGoals() {
    return JSON.parse(localStorage.getItem(GOALS_KEY)) || [];
}

function saveGoals(goals) {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function addGoal() {
    const name = document.getElementById("goal-name").value;
    const amount = parseFloat(document.getElementById("goal-amount").value);
    const date = document.getElementById("goal-date").value;

    if (!name || !amount || !date) {
        alert("Fill all fields");
        return;
    }

    const months = getMonthsLeft(date);
    const monthly = amount / months;

    const goal = {
        id: Date.now(),
        name,
        amount,
        date,
        saved: 0,
        view: "percent" 
    };

    const goals = loadGoals();
    goals.push(goal);
    saveGoals(goals);

    alert(`Save $${monthly.toFixed(2)} per month`);
    renderGoals();
}

function getMonthsLeft(date) {
    const now = new Date();
    const target = new Date(date);
    return Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

function renderGoals() {
    const goals = loadGoals();
    const container = document.getElementById("goals-list");
    container.innerHTML = "";

    goals.forEach(g => {
        const percent = ((g.saved / g.amount) * 100).toFixed(0);
        const remaining = g.amount - g.saved;

        const div = document.createElement("div");

        div.className = "card " + (g.saved >= g.amount ? "goal-complete" : "goal-incomplete");

        div.innerHTML = `
            <h3>${g.name}</h3>
            <p>Target: $${g.amount}</p>
            <p>Date: ${g.date}</p>

            <p>${percent}% completed</p>

            <!-- Progress bar -->
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%"></div>
            </div>

            <p>
                ${g.view === "percent" ? percent + "%" : "$" + remaining + " left"}
            </p>

            <button onclick="toggleView(${g.id})">Toggle View</button>
            <button onclick="editGoal(${g.id})">Edit</button>
            <button onclick="addMoney(${g.id})">+ Save $50</button>
        `;

        container.appendChild(div);
    });
}

function toggleView(id) {
    const goals = loadGoals();
    const goal = goals.find(g => g.id === id);

    goal.view = goal.view === "percent" ? "amount" : "percent";

    saveGoals(goals);
    renderGoals();
}

function editGoal(id) {
    const goals = loadGoals();
    const goal = goals.find(g => g.id === id);

    const newAmount = prompt("New target amount:", goal.amount);
    const newDate = prompt("New target date:", goal.date);

    if (newAmount) goal.amount = parseFloat(newAmount);
    if (newDate) goal.date = newDate;

    saveGoals(goals);
    renderGoals();
}

function addMoney(id) {
    const goals = loadGoals();
    const goal = goals.find(g => g.id === id);

    goal.saved += 50; 

    saveGoals(goals);
    renderGoals();
}

document.addEventListener("DOMContentLoaded", renderGoals);