let imageQueue = [];

async function loadImages() {
  imageQueue = await window.electronAPI.getImageQueue();
  console.log(imageQueue);
}

loadImages();

function nextImage() {
  const next = imageQueue.shift();
  if (next) {
    document.getElementById("imageDisplay").src = `file://${next}`;
  } else {
    alert("No more images!");
  }
  console.log(next);
}

// by default, we only need 60 seconds
// TODO: add an interface to setup seconds

class Timer {
  time;
  name;
  displayElement;

  constructor(time, name, displayElement = null) {
    this.time = time;
    this.name = name;
    this.displayElement = displayElement;
  }
}

const DEFAULT_TIME = 60;

let player1Time = new Timer(
  DEFAULT_TIME,
  "1",
  document.getElementById("player1Timer"),
);
let player2Time = new Timer(
  DEFAULT_TIME,
  "2",
  document.getElementById("player2Timer"),
);

let currentSelectedTimer = player1Time;
let timerInterval; // Single interval for both timers

// Start the timer for the selected player (currentSelectedTimer)
function startTimer() {
  if (timerInterval) clearInterval(timerInterval); // Stop any active timer
  timerInterval = setInterval(() => {
    if (currentSelectedTimer.time > 0) {
      currentSelectedTimer.time -= 1;
      updateTimerDisplay(currentSelectedTimer);

      if (currentSelectedTimer.time < 45) {
        currentSelectedTimer.displayElement.classList.remove("phase1");
        currentSelectedTimer.displayElement.classList.add("phase2");
      }
      if (currentSelectedTimer.time < 30) {
        currentSelectedTimer.displayElement.classList.remove("phase2");
        currentSelectedTimer.displayElement.classList.add("phase3");
      }
      if (currentSelectedTimer.time < 15) {
        currentSelectedTimer.displayElement.classList.remove("phase3");
        currentSelectedTimer.displayElement.classList.add("phase4");
      }
    } else {
      congratulate(currentSelectedTimer.name);
      clearInterval(timerInterval); // Stop the timer when it reaches 0
    }
  }, 1000);
}

function initStart() {
  startTimer();
  nextImage();
}
// Reset the selected player's timer
function resetTimer() {
  loadImages();

  document.getElementById("imageDisplay").src = "";

  /*reset 2 timer */
  player1Time.time = DEFAULT_TIME;
  player2Time.time = DEFAULT_TIME;
  currentSelectedTimer = player1Time;

  updateTimerDisplay(player1Time);
  updateTimerDisplay(player2Time);

  player1Time.displayElement.classList.remove("phase2");
  player1Time.displayElement.classList.remove("phase3");
  player1Time.displayElement.classList.remove("phase4");
  player1Time.displayElement.classList.add("phase1");
  player1Time.displayElement.classList.remove("active");

  player2Time.displayElement.classList.remove("phase2");
  player2Time.displayElement.classList.remove("phase3");
  player2Time.displayElement.classList.remove("phase4");
  player2Time.displayElement.classList.add("phase1");
  player2Time.displayElement.classList.remove("active");

  clearInterval(timerInterval); // Stop the timer
}

// Switch between the timers for Player 1 and Player 2
function switchTimer() {
  currentSelectedTimer.displayElement.classList.remove("active"); // remove the styling for the old timer
  currentSelectedTimer =
    currentSelectedTimer === player1Time ? player2Time : player1Time;
  currentSelectedTimer.displayElement.classList.add("active"); // quickly switch to new style for the new timer

  nextImage(); // when switching between the timers, we need to switch the image.

  startTimer(); //restart the timer
}

function updateTimerDisplay(timer) {
  const timeInSeconds = timer.time;
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  timer.displayElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  timer.displayElement.classList.add("active");
}

function congratulate(player) {
  /*show the congratulate screen*/
  const overlayScreenElement = document.getElementById("overlayScreen");
  overlayScreenElement.classList.remove("hidden");

  /*change the messages*/
  const message = "Người chơi " + player + " đã thua";
  let messageElement = document.querySelector("h1.message");
  messageElement.textContent = message;
}

document.addEventListener("DOMContentLoaded", () => {
  const replayButton = document.querySelector("#overlayScreen button");
  if (replayButton) {
    replayButton.addEventListener("click", () => {
      window.electronAPI.restartApp();
    });
  }
});

document.body.onkeydown = (event) => {
  if (event.key === " ") {
    event.preventDefault();
    nextImage();
    currentSelectedTimer.time -= 3; // pelnaty for skipping the image
  }

  if (event.key === "Enter") {
    event.preventDefault();
    switchTimer();
  }

  if (event.key === "r") {
    event.preventDefault();
    resetTimer();
  }

  if (event.key === "s") {
    event.preventDefault();
    initStart();
  }
};
