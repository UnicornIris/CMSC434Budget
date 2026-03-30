let transactions = [{
    id: 1,
    name: "Netflix",
    amount: 15.99,
    category: "Entertainment",
    date: "2026-03-20",
    note: "Monthly subscription"
  }
];

let categories = ["Entertainment", "Food", "Rent", "Transportation","Shopping",
    "Bills", "Other"];


let currentList = transactions;

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

    renderTransactions();

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

function editTransaction(id) {
    const x = transactions.find(x => x.id === id);
    if (!x) return;

    const newName = prompt("Edit name:", x.name);
    const newAmount = parseFloat(prompt("Edit amount:", x.amount));
    const newCategory = prompt("Edit category:", x.category);
    const newDate = prompt("Edit date:", x.date);
    const newNote = prompt("Edit note:", x.note);

    x.name = newName;
    x.amount = newAmount;
    x.category = newCategory;
    x.date = newDate;
    x.note = newNote;

    renderTransactions();
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
    renderTransactions();
}

function showAllTransactions() {
    currentList = transactions;
    renderTransactions();
}



renderTransactions();
