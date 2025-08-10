// Game State Management
let gameState = {
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  isCountdown: false,
  score: 0,
  highScore: localStorage.getItem("flappyBirdHighScore") || 0,
  birdY: 50,
  birdVelocity: 0,
  gravity: 0.12,
  jumpPower: -1.8,
  pipes: [],
  pipeGap: 25, // Reduced from 150 to 25vh for better gameplay
  pipeWidth: 6,
  gameSpeed: 1,
  animationId: null,
  countdown: 3,
  canJump: true,
  jumpCooldown: 150,
};

// DOM Elements
const startScreen = document.getElementById("startScreen");
const gameUI = document.getElementById("gameUI");
const loadingScreen = document.getElementById("loadingScreen");
const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverScreen = document.getElementById("gameOverScreen");
const bird = document.getElementById("bird-1");
const currentScoreDisplay = document.getElementById("currentScore");
const gameHighScoreDisplay = document.getElementById("gameHighScore");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const finalScoreDisplay = document.getElementById("finalScore");
const finalHighScoreDisplay = document.getElementById("finalHighScore");
const gameInstructions = document.getElementById("gameInstructions");

// Audio Elements
let pointSound, dieSound;
let audioEnabled = true;

// Initialize the game
function initGame() {
  // Hide loading screen after assets are loaded
  setTimeout(() => {
    loadingScreen.style.display = "none";
    startScreen.style.display = "flex";
    updateHighScoreDisplay();
  }, 1000);

  // Load audio
  loadAudio();

  // Event listeners
  setupEventListeners();
}

// Load audio files
function loadAudio() {
  try {
    pointSound = new Audio("sounds effect/point.mp3");
    dieSound = new Audio("sounds effect/die.mp3");

    // Preload audio
    pointSound.load();
    dieSound.load();

    // Set volume
    pointSound.volume = 0.3;
    dieSound.volume = 0.4;
  } catch (error) {
    console.log("Audio not supported or failed to load");
    audioEnabled = false;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Start button
  document.getElementById("startBtn").addEventListener("click", startGame);

  // Resume button
  document.getElementById("resumeBtn").addEventListener("click", resumeGame);

  // Restart button
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  // Menu button
  document.getElementById("menuBtn").addEventListener("click", showStartScreen);

  // Keyboard controls
  document.addEventListener("keydown", handleKeyPress);

  // Touch controls for mobile
  document.addEventListener("touchstart", handleTouch);
}

// Handle keyboard input
function handleKeyPress(event) {
  if (!gameState.isPlaying) return;

  switch (event.code) {
    case "Space":
    case "ArrowUp":
      event.preventDefault();
      if (!gameState.isPaused) {
        jump();
      }
      break;
    case "KeyP":
      event.preventDefault();
      togglePause();
      break;
    case "KeyR":
      event.preventDefault();
      restartGame();
      break;
  }
}

// Handle touch input
function handleTouch(event) {
  if (!gameState.isPlaying || gameState.isPaused) return;
  event.preventDefault();
  jump();
}

// Start the game
function startGame() {
  gameState.isPlaying = true;
  gameState.isGameOver = false;
  gameState.isCountdown = true;
  gameState.score = 0;
  gameState.birdY = 50;
  gameState.birdVelocity = 0;
  gameState.pipes = [];
  gameState.countdown = 3;

  startScreen.style.display = "none";
  gameUI.style.display = "block";

  updateScoreDisplay();
  startCountdown();
}

// Start countdown before game begins
function startCountdown() {
  const countdownElement = document.createElement("div");
  countdownElement.className = "countdown";
  countdownElement.innerHTML =
    '<h2>Get Ready!</h2><div class="countdown-number">3</div>';
  document.body.appendChild(countdownElement);

  let count = 3;
  const countdownInterval = setInterval(() => {
    count--;
    const numberElement = countdownElement.querySelector(".countdown-number");
    if (numberElement) {
      numberElement.textContent = count;
    }

    if (count <= 0) {
      clearInterval(countdownInterval);
      countdownElement.innerHTML = "<h2>Go!</h2>";

      // Add a small delay after "Go!" before starting the game
      setTimeout(() => {
        countdownElement.remove();
        gameState.isCountdown = false;
        // Start with very gentle movement
        gameState.birdVelocity = 0;
        gameState.gravity = 0.1; // Even gentler gravity at start
        gameLoop();

        // Gradually increase gravity to normal after 2 seconds
        setTimeout(() => {
          gameState.gravity = 0.15;
        }, 2000);
      }, 1000);
    }
  }, 1000);
}

// Resume game from pause
function resumeGame() {
  gameState.isPaused = false;
  pauseOverlay.style.display = "none";
  gameLoop();
}

// Pause/Unpause game
function togglePause() {
  if (!gameState.isPlaying || gameState.isGameOver) return;

  if (gameState.isPaused) {
    resumeGame();
  } else {
    gameState.isPaused = true;
    pauseOverlay.style.display = "flex";
    cancelAnimationFrame(gameState.animationId);
  }
}

// Main game loop
function gameLoop() {
  if (gameState.isPaused || gameState.isGameOver) return;

  updateGame();
  renderGame();

  gameState.animationId = requestAnimationFrame(gameLoop);
}

// Update game state
function updateGame() {
  // Update bird physics
  updateBird();

  // Update pipes
  updatePipes();

  // Check collisions
  checkCollisions();

  // Spawn new pipes
  if (
    gameState.pipes.length === 0 ||
    gameState.pipes[gameState.pipes.length - 1].x < 70
  ) {
    spawnPipe();
  }
}

// Update bird physics
function updateBird() {
  if (gameState.isCountdown) return;

  // Apply gravity more gently
  gameState.birdVelocity += gameState.gravity;

  // Limit maximum falling speed
  if (gameState.birdVelocity > 2) {
    gameState.birdVelocity = 2;
  }

  // Limit maximum upward speed
  if (gameState.birdVelocity < -2) {
    gameState.birdVelocity = -2;
  }

  gameState.birdY += gameState.birdVelocity;

  // Keep bird within screen bounds with much more forgiving boundaries
  if (gameState.birdY < 2) {
    gameState.birdY = 2;
    gameState.birdVelocity = 0;
  }
  if (gameState.birdY > 95) {
    gameState.birdY = 95;
    gameState.birdVelocity = 0;
  }
}

// Update pipes
function updatePipes() {
  for (let i = gameState.pipes.length - 1; i >= 0; i--) {
    const pipe = gameState.pipes[i];
    pipe.x -= gameState.gameSpeed;

    // Remove pipes that are off screen
    if (pipe.x < -gameState.pipeWidth) {
      gameState.pipes.splice(i, 1);
    }

    // Check if bird passed pipe
    if (!pipe.passed && pipe.x < 30) {
      pipe.passed = true;
      gameState.score++;
      updateScoreDisplay();
      playSound(pointSound);
    }
  }
}

// Spawn new pipe
function spawnPipe() {
  const gapY = Math.random() * 60 + 20; // Random gap position

  const topPipe = {
    x: 100,
    y: 0,
    height: gapY,
    width: gameState.pipeWidth,
    passed: false,
  };

  const bottomPipe = {
    x: 100,
    y: gapY + gameState.pipeGap, // Start from the gap position
    height: 100 - (gapY + gameState.pipeGap), // Height from gap to bottom
    width: gameState.pipeWidth,
    passed: false,
  };

  gameState.pipes.push(topPipe, bottomPipe);

  // Debug: log pipe creation
  console.log("Pipes spawned:", topPipe, bottomPipe);
}

// Check for collisions
function checkCollisions() {
  if (gameState.isCountdown) return;

  const birdRect = {
    x: 30,
    y: gameState.birdY,
    width: 8,
    height: 6,
  };

  // Check pipe collisions
  for (const pipe of gameState.pipes) {
    if (
      birdRect.x < pipe.x + pipe.width &&
      birdRect.x + birdRect.width > pipe.x &&
      birdRect.y < pipe.y + pipe.height &&
      birdRect.y + birdRect.height > pipe.y
    ) {
      gameOver();
      return;
    }
  }

  // Only die when bird goes completely off screen (very forgiving)
  if (gameState.birdY <= 0 || gameState.birdY >= 98) {
    gameOver();
  }
}

// Render game
function renderGame() {
  // Update bird position
  bird.style.top = gameState.birdY + "vh";

  // Add flapping animation
  if (gameState.birdVelocity < 0) {
    bird.classList.add("flapping");
  } else {
    bird.classList.remove("flapping");
  }

  // Render pipes
  renderPipes();
}

// Render pipes
function renderPipes() {
  // Remove existing pipe elements
  const existingPipes = document.querySelectorAll(".pipe_sprite");
  existingPipes.forEach((pipe) => pipe.remove());

  // Create new pipe elements
  gameState.pipes.forEach((pipe) => {
    const pipeElement = document.createElement("div");
    pipeElement.className = "pipe_sprite";

    // Fix positioning - use fixed positioning and proper units
    pipeElement.style.position = "fixed";
    pipeElement.style.left = pipe.x + "vw";
    pipeElement.style.top = pipe.y + "vh";
    pipeElement.style.height = pipe.height + "vh";
    pipeElement.style.width = pipe.width + "vw";

    // Fix z-index - pipes should be behind the bird
    pipeElement.style.zIndex = "10";

    // Remove debug styling and use proper pipe appearance
    pipeElement.style.background = "radial-gradient(lightgreen 50%, green)";
    pipeElement.style.border = "5px solid #2c3e50";
    pipeElement.style.borderRadius = "5px";
    pipeElement.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.3)";

    document.body.appendChild(pipeElement);
  });
}

// Jump function
function jump() {
  if (
    gameState.isPaused ||
    gameState.isGameOver ||
    gameState.isCountdown ||
    !gameState.canJump
  )
    return;

  // Much gentler jump - just a small upward boost
  gameState.birdVelocity = gameState.jumpPower;

  // Prevent multiple rapid jumps from stacking
  if (gameState.birdVelocity < -1) {
    gameState.birdVelocity = gameState.jumpPower;
  }

  // Add jump cooldown to prevent rapid tapping
  gameState.canJump = false;
  setTimeout(() => {
    gameState.canJump = true;
  }, gameState.jumpCooldown);
}

// Game over
function gameOver() {
  gameState.isPlaying = false;
  gameState.isGameOver = true;

  playSound(dieSound);

  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem("flappyBirdHighScore", gameState.highScore);
    updateHighScoreDisplay();
  }

  // Show game over screen
  showGameOverScreen();

  // Cancel animation
  cancelAnimationFrame(gameState.animationId);
}

// Show game over screen
function showGameOverScreen() {
  finalScoreDisplay.textContent = gameState.score;
  finalHighScoreDisplay.textContent = gameState.highScore;
  gameOverScreen.style.display = "flex";
  gameInstructions.style.display = "none";
}

// Restart game
function restartGame() {
  // Hide all overlays
  pauseOverlay.style.display = "none";
  gameOverScreen.style.display = "none";

  // Clear pipes
  const existingPipes = document.querySelectorAll(".pipe_sprite");
  existingPipes.forEach((pipe) => pipe.remove());

  // Remove countdown if it exists
  const countdownElement = document.querySelector(".countdown");
  if (countdownElement) {
    countdownElement.remove();
  }

  // Reset game state
  gameState.isPlaying = false;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameState.isCountdown = false;
  gameState.score = 0;
  gameState.birdY = 50;
  gameState.birdVelocity = 0;
  gameState.pipes = [];
  gameState.countdown = 3;

  // Cancel any ongoing animation
  if (gameState.animationId) {
    cancelAnimationFrame(gameState.animationId);
    gameState.animationId = null;
  }

  // Show start screen
  showStartScreen();
}

// Show start screen
function showStartScreen() {
  startScreen.style.display = "flex";
  gameUI.style.display = "none";
  gameInstructions.style.display = "block";
  updateHighScoreDisplay();
}

// Update score display
function updateScoreDisplay() {
  currentScoreDisplay.textContent = gameState.score;
  gameHighScoreDisplay.textContent = gameState.highScore;
}

// Update high score display
function updateHighScoreDisplay() {
  highScoreDisplay.textContent = gameState.highScore;
}

// Play sound
function playSound(audio) {
  if (audioEnabled && audio) {
    try {
      audio.currentTime = 0;
      audio.play();
    } catch (error) {
      console.log("Failed to play audio");
    }
  }
}

// Initialize game when page loads
document.addEventListener("DOMContentLoaded", initGame);

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener("visibilitychange", () => {
  if (document.hidden && gameState.isPlaying && !gameState.isPaused) {
    togglePause();
  }
});

// Handle window resize
window.addEventListener("resize", () => {
  // Adjust game elements for new screen size
  if (gameState.isPlaying) {
    renderGame();
  }
});
