// Game State Management
let gameState = {
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  isCountdown: false,
  score: 0,
  highScore: localStorage.getItem("flappyBirdHighScore") || 0,
  // Ground line and bird size in vh for consistent alignment
  groundTop: 85, // Top coordinate (vh) where ground starts
  birdHeightVh: 20, // Bird visual height in vh (keep in sync with CSS)
  birdY: 65, // groundTop - birdHeightVh
  birdVelocity: 0,
  gravity: 0.5, // Reduced gravity for slower, more controlled jumping
  jumpPower: -8, // Reduced jump power for gentler jumps
  obstacles: [], // Changed from pipes to obstacles
  obstacleGap: 50, // Increased distance between obstacles
  obstacleWidth: 10, // Consistent width for all obstacles
  obstacleHeight: 10, // Consistent height for all obstacles
  gameSpeed: 0.5, // Start with very slow speed
  baseGameSpeed: 0.5, // Store the base speed for progression
  maxGameSpeed: 2.5, // Maximum speed limit
  animationId: null,
  countdown: 3,
  canJump: true,
  jumpCooldown: 300, // Longer cooldown for jumping
  baseObstacleGap: 50, // Store the base gap for difficulty progression
  isGrounded: true, // Track if bird is on the ground
  obstacleTypes: ["stone", "stone2", "cactus", "wood"], // Different obstacle types
  guideTimeoutId: null, // timer id for hint card
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
const backgroundNight = document.getElementById("backgroundNight");
const stopSign = document.getElementById("stopSign");

// Audio Elements
let pointSound, dieSound, bgmSound;
let audioEnabled = localStorage.getItem("flappyAudio") !== "off";

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

  // Initialize audio button state
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  if (audioToggleBtn) {
    audioToggleBtn.classList.toggle("muted", !audioEnabled);
    audioToggleBtn.textContent = audioEnabled ? "🔊" : "🔇";
  }
}

// Load audio files
function loadAudio() {
  try {
    pointSound = new Audio("sounds effect/point.mp3");
    dieSound = new Audio("sounds effect/die.mp3");
    bgmSound = new Audio("sounds effect/bgm.mp3");

    // Preload audio
    pointSound.load();
    dieSound.load();
    bgmSound.load();

    // Set volume
    pointSound.volume = 0.3;
    dieSound.volume = 0.4;
    bgmSound.volume = 0.2;
    bgmSound.loop = true;
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

  // Audio toggle
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener("click", toggleAudio);
  }
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
  // Snap bird so its bottom sits at the ground line
  gameState.birdY = gameState.groundTop - gameState.birdHeightVh;
  gameState.birdVelocity = 0;
  gameState.obstacles = [];
  gameState.countdown = 3;
  gameState.gameSpeed = gameState.baseGameSpeed; // Reset to base speed

  startScreen.style.display = "none";
  gameUI.style.display = "block";
  if (bird) bird.style.display = "block";

  updateScoreDisplay();
  startCountdown();

  // Show gameplay hint for 5 seconds at the start only
  if (gameState.guideTimeoutId) {
    clearTimeout(gameState.guideTimeoutId);
    gameState.guideTimeoutId = null;
  }
  if (gameInstructions) {
    gameInstructions.style.display = "block";
    gameState.guideTimeoutId = setTimeout(() => {
      gameInstructions.style.display = "none";
      gameState.guideTimeoutId = null;
    }, 5000);
  }

  // Start background music after a user gesture
  if (audioEnabled && bgmSound) {
    try {
      bgmSound.currentTime = 0;
      if (!bgmSound.paused) bgmSound.pause();
      bgmSound.play().catch(() => {});
    } catch (e) {}
  }

  // Reset background to day on new run
  if (backgroundNight) backgroundNight.classList.remove("active");
  if (stopSign) stopSign.style.display = "none";
}

// Start countdown before game begins
function startCountdown() {
  const countdownElement = document.createElement("div");
  countdownElement.className = "countdown";
  countdownElement.innerHTML =
    '<h2>Get Ready!</h2><div class="countdown-number">3</div>';
  document.body.appendChild(countdownElement);

  // Hide runner during countdown to avoid visual overlap
  if (bird) bird.style.display = "none";

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
        if (bird) bird.style.display = "block"; // show when countdown finishes
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

  if (audioEnabled && bgmSound) {
    bgmSound.play().catch(() => {});
  }
  if (stopSign) stopSign.style.display = "none";
  if (bird) bird.style.display = "block";
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
    if (bgmSound) bgmSound.pause();
    if (stopSign && bird) {
      stopSign.style.display = "block";
      // Position exactly at the bird, then we can adjust a tiny offset in code for realism
      stopSign.style.left = getComputedStyle(bird).left;
      stopSign.style.top = getComputedStyle(bird).top;
      bird.style.display = "none"; // hide runner while showing stop image
    }
  }
}

// Toggle audio globally (BGM + SFX)
function toggleAudio() {
  audioEnabled = !audioEnabled;
  const btn = document.getElementById("audioToggleBtn");
  if (btn) {
    btn.classList.toggle("muted", !audioEnabled);
    btn.textContent = audioEnabled ? "🔊" : "🔇";
  }
  // Persist preference
  localStorage.setItem("flappyAudio", audioEnabled ? "on" : "off");
  if (bgmSound) {
    if (audioEnabled) {
      bgmSound.play().catch(() => {});
    } else {
      bgmSound.pause();
    }
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
  updateObstacles();

  // Check collisions
  checkCollisions();

  // Spawn new obstacles with varied spacing
  maybeSpawnObstacle();

  // Toggle night background when score threshold reached
  if (backgroundNight) {
    if (gameState.score >= 10) {
      backgroundNight.classList.add("active");
    }
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

  // Ground collision - bird runs on the ground (adjusted to groundY)
  if (gameState.birdY + gameState.birdHeightVh >= gameState.groundTop) {
    gameState.birdY = gameState.groundTop - gameState.birdHeightVh;
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

// Update obstacles (stones, cacti, wood)
function updateObstacles() {
  if (gameState.isCountdown) return;

  // Calculate current game speed based on score
  gameState.gameSpeed = calculateGameSpeed();

  // Move obstacles left
  gameState.obstacles.forEach((obstacle) => {
    obstacle.x -= gameState.gameSpeed;

    // Check if obstacle passed the bird
    if (!obstacle.passed && obstacle.x + obstacle.width < 30) {
      obstacle.passed = true;
      gameState.score++;
      updateScoreDisplay();
      playSound(pointSound);
    }
  });

  // Remove obstacles that are off screen
  gameState.obstacles = gameState.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > -10
  );
}

// Calculate dynamic obstacle gap based on score
function calculateObstacleGap() {
  // Wider, more varied gaps. Never too close.
  const base = Math.max(
    80,
    gameState.baseObstacleGap + Math.floor(gameState.score / 6) * 4
  );
  const randomExtra = Math.random() * 60; // 0 - 60 vw extra
  return base + randomExtra; // 80 - 200+ depending on score
}

// Calculate progressive game speed based on score
function calculateGameSpeed() {
  // Start with base speed and increase gradually
  const speedIncrease = Math.floor(gameState.score / 10) * 0.2; // Increase speed every 10 points
  const newSpeed = Math.min(
    gameState.baseGameSpeed + speedIncrease,
    gameState.maxGameSpeed
  );
  return newSpeed;
}

// Spawn new obstacle
function spawnObstacle() {
  // Randomly select obstacle type
  const randomType =
    gameState.obstacleTypes[
      Math.floor(Math.random() * gameState.obstacleTypes.length)
    ];

  // Create obstacle on the ground with consistent positioning
  const obstacleHeight = Math.max(
    14,
    gameState.obstacleHeight - Math.random() * 6
  ); // slightly lower, randomize a bit
  const obstacleWidth = Math.max(
    8,
    gameState.obstacleWidth - Math.random() * 2
  );

  const obstacle = {
    x: 100,
    y: gameState.groundTop - obstacleHeight, // sit on ground line
    height: obstacleHeight,
    width: obstacleWidth,
    type: randomType,
    passed: false,
  };

  gameState.obstacles.push(obstacle);

  // Determine next dynamic gap and store target X for next spawn
  const gap = calculateObstacleGap();
  gameState.nextObstacleGap = gap;
  // next spawn is based on how far the last obstacle moved from 100vw
}

function maybeSpawnObstacle() {
  if (gameState.obstacles.length === 0) {
    // First obstacle
    spawnObstacle();
    return;
  }
  const last = gameState.obstacles[gameState.obstacles.length - 1];
  const gap =
    typeof gameState.nextObstacleGap === "number"
      ? gameState.nextObstacleGap
      : calculateObstacleGap();
  // Spawn when the last obstacle has moved at least 'gap' from the initial 100vw
  if (100 - last.x >= gap) {
    spawnObstacle();
  }
}

// Check for collisions
function checkCollisions() {
  if (gameState.isCountdown) return;

  const birdRect = {
    // Shift hitbox to the right so collisions trigger closer to bird's center
    x: 32.5, // vw
    y: gameState.birdY + 4.0, // vh
    width: 3.0, // vw
    height: Math.max(8, gameState.birdHeightVh - 8), // vh
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

  // Only die when bird goes completely off the top of the screen
  if (gameState.birdY <= 0) {
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

  // Keep stop sign perfectly aligned with bird while paused
  if (gameState.isPaused && stopSign && stopSign.style.display !== "none") {
    stopSign.style.left = getComputedStyle(bird).left;
    stopSign.style.top = getComputedStyle(bird).top;
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

    // Fix z-index - obstacles should be behind overlays and the bird
    obstacleElement.style.zIndex = "5";

    // Remove all borders and styling completely
    obstacleElement.style.border = "none";
    obstacleElement.style.outline = "none";
    obstacleElement.style.boxShadow = "none";
    obstacleElement.style.backgroundColor = "transparent";

    // Use different images based on obstacle type
    switch (obstacle.type) {
      case "stone":
        obstacleElement.style.backgroundImage = "url('images/snake.png')";
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
        obstacleElement.style.backgroundImage = "url('images/snake.png')";
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

  if (bgmSound) bgmSound.pause();
  if (bird) bird.style.display = "none";

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
  gameState.birdY = gameState.groundTop - gameState.birdHeightVh;
  gameState.birdVelocity = 0;
  gameState.obstacles = [];
  gameState.countdown = 3;
  gameState.gameSpeed = gameState.baseGameSpeed; // Reset to base speed

  // Cancel any ongoing animation
  if (gameState.animationId) {
    cancelAnimationFrame(gameState.animationId);
    gameState.animationId = null;
  }

  // Show start screen
  showStartScreen();

  // Ensure day mode on restart
  if (backgroundNight) backgroundNight.classList.remove("active");
  if (stopSign) stopSign.style.display = "none";

  // Hide gameplay hint on restart until next start
  if (gameInstructions) {
    gameInstructions.style.display = "none";
  }
  if (gameState.guideTimeoutId) {
    clearTimeout(gameState.guideTimeoutId);
    gameState.guideTimeoutId = null;
  }
}

// Show start screen
function showStartScreen() {
  startScreen.style.display = "flex";
  gameUI.style.display = "none";
  gameInstructions.style.display = "block";
  updateHighScoreDisplay();
  if (bird) bird.style.display = "none";
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
