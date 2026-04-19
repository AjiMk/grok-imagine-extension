const navButtons = Array.from(document.querySelectorAll(".nav-item[data-target]"));
const screens = Array.from(document.querySelectorAll(".screen"));

function showScreen(target) {
  for (const screen of screens) {
    screen.classList.toggle("active", screen.dataset.screen === target);
  }

  for (const button of navButtons) {
    button.classList.toggle("active", button.dataset.target === target);
  }
}

for (const button of navButtons) {
  button.addEventListener("click", () => showScreen(button.dataset.target));
}

showScreen("templates");
