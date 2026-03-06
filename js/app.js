function openTab(tabName, elmnt) {
  var i, tabcontent, tablinks;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }

  var targetTab = document.getElementById(tabName);
  if (targetTab) {
    targetTab.style.display = (tabName === "Text") ? "flex" : "block";
  }

  elmnt.classList.add("active");

  if (tabName === "Colors") {
  initColorsChart();
  }
}
/*source: https://www.w3schools.com/js/js_events_mouse.asp*/
document.addEventListener("DOMContentLoaded", function() {
  var defaultTab = document.getElementById("defaultOpen");
  if (defaultTab) {
    defaultTab.click();
  }
});

function showWarning() {
  document.getElementById("profileWarning").style.display = "block";
}

function closeWarning() {
  document.getElementById("profileWarning").style.display = "none";
}

function printChoices() {
  var radio = document.querySelector('input[name="cameraType1"]:checked');
  var dropdown = document.getElementById("cameraType2");
  var type1 = radio ? radio.value : "none";
  var type2 = dropdown.value;
  document.getElementById("choicesOutput").textContent =
    "You picked " + type1 + " (radio) and " + type2 + " (dropdown).";
}

function addTodo() {
  var input = document.getElementById("todoInput");
  var text = input.value.trim();
  if (text === "") return;

  var li = document.createElement("li");

  var checkMark = document.createElement("span");
  checkMark.className = "check-mark";
  checkMark.textContent = "\u2713";

  var todoText = document.createElement("span");
  todoText.className = "todo-text";
  todoText.textContent = text;

  var deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "\u00d7";
  deleteBtn.onclick = function() {
    li.remove();
  };

  li.onclick = function(e) {
    if (e.target === deleteBtn) return;
    li.classList.toggle("checked");
  };

  li.appendChild(checkMark);
  li.appendChild(todoText);
  li.appendChild(deleteBtn);

  document.getElementById("todoList").appendChild(li);
  input.value = "";
  input.focus();
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && document.activeElement.id === "todoInput") {
    addTodo();
  }
});

let colorsChartInitialized = false;

function initColorsChart() {
  if (colorsChartInitialized) return;
  colorsChartInitialized = true;

  const canvas = document.getElementById("colorsChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Roses", "Violets", "Tulips"],
      datasets: [{
        data: [300, 500, 100],
        backgroundColor: [
          "#f43f5e",
          "#e879f9",
          "#fde047"
        ],
        borderColor: "#ffffff",
        borderWidth: 3
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: "#000",
          font: {
            size: 18,
            weight: "bold"
          },
          formatter: value => value
        },
        legend: {
          position: "bottom",
          labels: {
            font: { size: 16 }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}