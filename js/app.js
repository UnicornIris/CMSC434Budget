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
}

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
