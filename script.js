// Game State Management
let gameState = {
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  isCountdown: false,
  score: 0,
  highScore: localStorage.getItem("flappyBirdHighScore") || 0,
  birdY: 70, // Bird now runs on the ground (70vh from top) - properly positioned on ground
  birdVelocity: 0,
  gravity: 0.5, // Reduced gravity for slower, more controlled jumping
  jumpPower: -8, // Reduced jump power for gentler jumps
  obstacles: [], // Changed from pipes to obstacles
  obstacleGap: 50, // Increased distance between obstacles
  obstacleWidth: 10, // Consistent width for all obstacles
  obstacleHeight: 20, // Consistent height for all obstacles
  gameSpeed: 1, // Slower horizontal movement for better control
  animationId: null,
  countdown: 3,
  canJump: true,
  jumpCooldown: 300, // Longer cooldown for jumping
  baseObstacleGap: 50, // Store the base gap for difficulty progression
  isGrounded: true, // Track if bird is on the ground
  obstacleTypes: ["stone", "stone2", "cactus", "wood"], // Different obstacle types
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
  gameState.birdY = 70;
  gameState.birdVelocity = 0;
  gameState.obstacles = [];
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
    gameState.obstacles.length === 0 ||
    gameState.obstacles[gameState.obstacles.length - 1].x < 70
  ) {
    spawnObstacle();
  }
}

// Update bird physics
function updateBird() {
  if (gameState.isCountdown) return;

  // Apply gravity for jumping
  gameState.birdVelocity += gameState.gravity;

  // Limit maximum falling speed
  if (gameState.birdVelocity > 8) {
    gameState.birdVelocity = 8;
  }

  // Limit maximum upward speed
  if (gameState.birdVelocity < -8) {
    gameState.birdVelocity = -8;
  }

  gameState.birdY += gameState.birdVelocity;

  // Ground collision - bird runs on the ground (adjusted to 70)
  if (gameState.birdY >= 71) {
    gameState.birdY = 71;
    gameState.birdVelocity = 0;
    gameState.isGrounded = true;
  } else {
    gameState.isGrounded = false;
  }

  // Ceiling collision - prevent bird from going too high
  if (gameState.birdY < 20) {
    gameState.birdY = 20;
    gameState.birdVelocity = 0;
  }
}

// Update pipes
function updatePipes() {
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.x -= gameState.gameSpeed;

    // Remove pipes that are off screen
    if (obstacle.x < -gameState.obstacleWidth) {
      gameState.obstacles.splice(i, 1);
    }

    // Check if bird passed pipe
    if (!obstacle.passed && obstacle.x < 30) {
      obstacle.passed = true;
      gameState.score++;
      updateScoreDisplay();
      playSound(pointSound);
    }
  }
}

// Calculate dynamic pipe gap based on score (gets harder as score increases)
function calculateObstacleGap() {
  // Start with base gap and reduce it as score increases
  const difficultyFactor = Math.min(gameState.score / 10, 1); // Max difficulty at score 10
  const minGap = 20; // Minimum gap (hardest)
  const maxGap = gameState.baseObstacleGap; // Maximum gap (easiest)

  // Linear difficulty progression
  const currentGap = maxGap - difficultyFactor * (maxGap - minGap);

  return Math.max(currentGap, minGap);
}

// Spawn new obstacle
function spawnObstacle() {
  // Calculate dynamic gap based on current score
  const currentGap = calculateObstacleGap();

  // Randomly select obstacle type
  const randomType =
    gameState.obstacleTypes[
      Math.floor(Math.random() * gameState.obstacleTypes.length)
    ];

  // Create obstacle on the ground with consistent positioning
  const obstacle = {
    x: 100,
    y: 70 - gameState.obstacleHeight, // Position on ground (70vh) minus obstacle height
    height: gameState.obstacleHeight,
    width: gameState.obstacleWidth,
    type: randomType, // Store the obstacle type
    passed: false,
  };

  gameState.obstacles.push(obstacle);

  // Debug: log obstacle creation with current difficulty
  console.log(
    "Obstacle spawned:",
    randomType,
    "with gap:",
    currentGap,
    "Score:",
    gameState.score,
    obstacle
  );
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

  // Check obstacle collisions (stones)
  for (const obstacle of gameState.obstacles) {
    if (
      birdRect.x < obstacle.x + obstacle.width &&
      birdRect.x + birdRect.width > obstacle.x &&
      birdRect.y < obstacle.y + obstacle.height &&
      birdRect.y + birdRect.height > obstacle.y
    ) {
      gameOver();
      return;
    }
  }

  // Only die when bird goes completely off screen
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
  renderObstacles();
}

// Render obstacles (stones, cacti, wood)
function renderObstacles() {
  // Remove existing obstacle elements
  const existingObstacles = document.querySelectorAll(".pipe_sprite");
  existingObstacles.forEach((obstacle) => obstacle.remove());

  // Create new obstacle elements
  gameState.obstacles.forEach((obstacle) => {
    const obstacleElement = document.createElement("div");
    obstacleElement.className = "pipe_sprite"; // Keep class name for now

    // Fix positioning - use fixed positioning and proper units
    obstacleElement.style.position = "fixed";
    obstacleElement.style.left = obstacle.x + "vw";
    obstacleElement.style.top = obstacle.y + "vh";
    obstacleElement.style.height = obstacle.height + "vh";
    obstacleElement.style.width = obstacle.width + "vw";

    // Fix z-index - obstacles should be behind the bird
    obstacleElement.style.zIndex = "10";

    // Remove all borders and styling completely
    obstacleElement.style.border = "none";
    obstacleElement.style.outline = "none";
    obstacleElement.style.boxShadow = "none";
    obstacleElement.style.backgroundColor = "transparent";

    // Use different images based on obstacle type
    switch (obstacle.type) {
      case "stone":
        obstacleElement.style.backgroundImage = "url('images/stone.png')";
        break;
      case "stone2":
        obstacleElement.style.backgroundImage = "url('images/stone2.png')";
        break;
      case "cactus":
        obstacleElement.style.backgroundImage = "url('images/cactus.png')";
        break;
      case "wood":
        obstacleElement.style.backgroundImage = "url('images/wood.png')";
        break;
      default:
        obstacleElement.style.backgroundImage = "url('images/stone.png')";
    }

    obstacleElement.style.backgroundSize = "100% 100%";
    obstacleElement.style.backgroundRepeat = "no-repeat";
    obstacleElement.style.backgroundPosition = "center";

    document.body.appendChild(obstacleElement);
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
  gameState.birdY = 70;
  gameState.birdVelocity = 0;
  gameState.obstacles = [];
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
