const GOALS_KEY = "budget-goals";

function loadGoals() {
    try {
        const raw = localStorage.getItem(GOALS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
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
    if (!goal) return;
    const amount = prompt("How much did you save?");
    const n = parseFloat(amount);
    if (amount === null || amount === "" || Number.isNaN(n)) return;
    goal.saved += n;
    saveGoals(goals);
    renderGoals();
}

function deleteGoal(id) {
    const confirmDelete = confirm("Are you sure you want to delete this goal?");
    if (!confirmDelete) return;

    let goals = loadGoals();
    goals = goals.filter(g => g.id !== id);

    saveGoals(goals);
    renderGoals();
}

function renderGoals() {
    const goals = loadGoals();

    const activeContainer = document.getElementById("goals-list");
    const completedContainer = document.getElementById("completed-goals-list");

    activeContainer.innerHTML = "";
    completedContainer.innerHTML = "";

    goals.forEach(g => {
        const percent = ((g.saved / g.amount) * 100).toFixed(0);

        const div = document.createElement("div");

        div.className = "goal-card " + (g.saved >= g.amount ? "goal-complete" : "goal-incomplete");

        div.innerHTML = `
            <h3>${g.name}</h3>

            <p class="goal-numbers">
                $${g.saved.toFixed(0)} / $${g.amount.toFixed(0)}
            </p>

            <p class="goal-percent">
                ${percent}% complete
            </p>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%"></div>
            </div>

            <p class="goal-date">Due: ${g.date}</p>

            ${
                g.saved < g.amount
                ?  `<div class="goal-actions">
                        <button onclick="addMoney(${g.id})">+ $50</button>
                        <button onclick="editGoal(${g.id})">Edit</button>
                        <button onclick="deleteGoal(${g.id})" class="btn-delete">Delete</button>
                    </div>`
                : `<div>
                            <p class="goal-done"> Goal Achieved</p>
                            <div class="goal-actions">
                                <button onclick="deleteGoal(${g.id})" class="btn-delete">Delete</button>
                            </div>
                    </div>`
            }
        `;

        if (g.saved >= g.amount) {
            completedContainer.appendChild(div);
        } else {
            activeContainer.appendChild(div);
        }
    });
}

document.addEventListener("DOMContentLoaded", renderGoals);