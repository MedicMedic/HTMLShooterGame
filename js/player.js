// player.js

// Load player image
const playerImg = new Image(); // Ensure the player image is defined
playerImg.src = 'assets/player/PHplayer.png'; // Ensure the player image path is correct

// PLAYER PROPERTIES
let playerX = 375; // Initial X position of the player
let playerY = 550; // Initial Y position of the player
const playerWidth = 50; // Width of the player
const playerHeight = 50; // Height of the player
let playerSpeed = 5; // Speed of the player
const originalPlayerSpeed = playerSpeed; // Store original speed for flicker effect
let playerVelY = 0; // Vertical velocity of the player
let playerHealth = 3; // Player health (lives)
let playerScore = 0; // Player score
let isFlickering = false; // Whether the player is flickering after taking damage
let facingLeft = false; // Whether the player is facing left
let canJump = true; // Whether the player can jump

// Touch and flicker logic
let touchStartTime = null; // Time when the player first touches an enemy
let flickerStartTime = null; // Time when the flicker effect starts
let hasTakenDamage = false; // Whether the player has taken damage
let totalTouchTime = 0; // Total time player has been in contact with enemies
let lastTouchTime = null; // Last time the player was touching an enemy

// KEY TRACKING
const keys = {}; // Object to track pressed keys

// Health and damage tracking
function updateHealthLogic(touchingEnemy) {
    const now = Date.now(); // Get current time in milliseconds

    if (touchingEnemy) {
        if (!lastTouchTime) {
            lastTouchTime = now; // Initialize last touch time if not set
        }

        // Accumulate time since last frame touching enemy
        totalTouchTime += now - lastTouchTime; // Calculate time since last touch
        lastTouchTime = now; // Update last touch time to current time

        // If 5 seconds of contact reached, take damage and start flicker
        if (totalTouchTime >= 5000 && !isFlickering) {
            playerHealth--; // Decrease player health
            totalTouchTime = 0; // Reset total touch time

            // Update lives display
            if (livesDisplay) livesDisplay.textContent = `Lives: ${playerHealth}`;

            // Start flickering after taking damage
            playerSpeed = originalPlayerSpeed / 2; // Reduce speed during flicker
            flickerStartTime = now; // Record the time when flicker starts
            isFlickering = true;// Set flickering state to true
        }

    } else {
        lastTouchTime = null;
    }

    // If flickering, check if flicker duration is over
    if (isFlickering && now - flickerStartTime >= 2000) {
        playerSpeed = originalPlayerSpeed;
        isFlickering = false;
    }
}

function drawPlayer(ctx) {    
    // Flicker drawing (player flickers if isFlickering)
    ctx.save(); // Save the current context
    ctx.translate(playerX, playerY); // Translate context to player position
    if (facingLeft) {
        ctx.scale(-1, 1); // Flip context for left-facing player
        if (!isFlickering || Math.floor(Date.now() / 100) % 2 === 0) { // Flicker effect
            ctx.drawImage(playerImg, -playerWidth, 0, playerWidth, playerHeight); // Draw left-facing player
        }
    } else {
        if (!isFlickering || Math.floor(Date.now() / 100) % 2 === 0) { // Flicker effect
            ctx.drawImage(playerImg, 0, 0, playerWidth, playerHeight); // Draw right-facing player
        }
    }
    ctx.restore();
}

function updatePlayerMovement() {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a']) {
        playerX -= playerSpeed; // Move player left
        facingLeft = true; // Set facing direction to left
    }
    if (keys['ArrowRight'] || keys['d']) {
        playerX += playerSpeed; // Move player right
        facingLeft = false; // Set facing direction to right
    }
}