let transactions = [
    { id: 1, name: 'Coffee', amount: 5.50, category: 'Coffee', 
    date: "2026-03-20", note: "Starbucks" },
    { id: 2, name: 'Lunch', amount: 12.99, category: 'Food', 
        date: "2026-03-18", note: "Starbucks" },
    { id: 3, name: 'Uber', amount: 8.25, category: 'Transport', 
        date: "2026-03-10", note: "Starbucks" },
    { id: 4, name: 'Groceries', amount: 45.00, category: 'Shopping', 
        date: "2026-03-22", note: "Starbucks" },
    { id: 5, name: 'Netflix', amount: 15.99, category: 'Bills', 
        date: "2026-03-01", note: "Starbucks" }
];

let categories = ["Entertainment", "Food", "Rent", "Transportation","Shopping",
    "Bills", "Other"];


let currentList = transactions;
let editingId = null;
function renderTransactions(dat = currentList) {
    const list = document.getElementById("transactionList");
    list.innerHTML = "";

    dat.forEach(x => {
        const li = document.createElement("li");

        li.innerHTML = `
            <strong>${x.name}</strong> - $${x.amount}
            (${x.category}) - ${x.date}
            <br>
            ${x.note || ""}
            <br>
            <button onclick="deleteTransaction(${x.id})">Delete</button>
            <button onclick="editTransaction(${x.id})">Edit</button>
            <hr>
        `;

        list.appendChild(li);
    });
}

function showTransForm() {
    document.getElementById("add-transaction-form").style.display = "block";
}

function addTransaction() {
    const name = document.getElementById("nameInput").value;
    const amount = parseFloat(document.getElementById("amountInput").value);
    const category = document.getElementById("categoryInput").value;
    const date = document.getElementById("dateInput").value;
    const note = document.getElementById("noteInput").value;

    const newTransaction = {
        id: Date.now(),
        name,
        amount,
        category,
        date,
        note
    };

    transactions.push(newTransaction);
    currentList = transactions;

    renderTransactions(currentList);

    document.getElementById("nameInput").value = "";
    document.getElementById("amountInput").value = "";
    document.getElementById("dateInput").value = "";
    document.getElementById("noteInput").value = "";

    document.getElementById("add-transaction-form").style.display = "none";
}

function updateCategoryDropdown() {
    const catInput = document.getElementById("categoryInput");
    catInput.innerHTML = "";

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        catInput.appendChild(option);
    });
}

function createCategory() {
    const cat = prompt("Enter new category name:");
    if (!cat) return;

    if (!categories.includes(cat)) {
        categories.push(cat);
        updateCategoryDropdown();
        alert("Category added!");
    } else {
        alert("Category already exists.");
    }
}
function cancelEdit() {
    document.getElementById("edit-form").style.display = "none";
}

function saveEdit() {
    const x = transactions.find(t => t.id === editingId);
    if (!x) return;

    x.name = document.getElementById("editName").value;
    x.amount = parseFloat(document.getElementById("editAmount").value);
    x.category = document.getElementById("editCategory").value;
    x.date = document.getElementById("editDate").value;
    x.note = document.getElementById("editNote").value;

    renderTransactions(currentList);

    document.getElementById("edit-form").style.display = "none";
}


function editTransaction(id) {
    const x = transactions.find(t => t.id === id);
    if (!x) return;

    editingId = id;

    document.getElementById("editName").value = x.name;
    document.getElementById("editAmount").value = x.amount;
    document.getElementById("editDate").value = x.date;
    document.getElementById("editNote").value = x.note;

    const select = document.getElementById("editCategory");
    select.innerHTML = "";

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;

        if (cat === x.category) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    document.getElementById("edit-form").style.display = "block";
}

function showDateRange() {
    document.getElementById("date-range").style.display = "block";
}

function rangeOfTransactions() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    currentList = transactions.filter(x => {
        return x.date >= start && x.date <= end;
    });

    renderTransactions(currentList);
}

function deleteTransaction(id) {
    transactions = transactions.filter(x => x.id !== id);
    currentList = transactions;

    renderTransactions(currentList);
}

function showAllTransactions() {
    currentList = transactions;
    renderTransactions(currentList);
}



renderTransactions();
