function openTab(tabName, elmnt, color) {
  // Hide all elements with class="tabcontent" by default */
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Remove the background color of all tablinks/buttons
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }

  // Show the specific tab content
  const targetTab = document.getElementById(tabName);
  if (targetTab) {
    targetTab.style.display = "block";
  }

  // Add the specific color to the button used to open the tab content
  elmnt.style.backgroundColor = color;
}

// Get the element with id="defaultOpen" and click on it
document.addEventListener("DOMContentLoaded", function() {
  const defaultTab = document.getElementById("defaultOpen");
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