let currency = "USD";

function loadSettings() {
    document.getElementById("currencyDisplay").textContent = currency;

    document.getElementById("lowBalanceToggle").checked = false;
    document.getElementById("billDueToggle").checked = false;
}

function toggleCurrency() {
    currency = (currency === "USD") ? "EUR" : "USD";
    document.getElementById("currencyDisplay").textContent = currency;
}

function saveSettings() {
    const lowBalanceAlert = document.getElementById("lowBalanceToggle").checked;
    const billDueAlert = document.getElementById("billDueToggle").checked;

    console.log("Low balance:", lowBalanceAlert);
    console.log("Bill due:", billDueAlert);
}

loadSettings();
