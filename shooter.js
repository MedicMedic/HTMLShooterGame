const canvas = document.getElementById('gameCanvas'); // Ensure the canvas is defined
const ctx = canvas.getContext('2d'); // Set canvas dimensions

// Load player image
const playerImg = new Image(); // Ensure the player image is defined
playerImg.src = 'assets/player/PHplayer.png'; // Ensure the player image path is correct

// Load bullet image
const bulletImg = new Image(); // Ensure the bullet image is defined
bulletImg.src = 'assets/bullets/PHbullet.png'; // Ensure the bullet image path is correct

// Load enemy image
const enemyImg = new Image(); // Ensure the enemy image is defined
enemyImg.src = 'assets/enemies/PHenemy.png'; // Ensure the enemy image path is correct

// Load platform image
const platformImg = new Image(); // Ensure the platform image is defined
platformImg.src = 'assets/environment/PHplatform.png'; // Ensure the platform image path is correct

// Set player properties
let playerX = 375; // Center player horizontally
let playerY = 550; // Start player on the ground
const playerWidth = 50; // Set player width
const playerHeight = 50; // Set player height
let playerSpeed = 5; // Set player speed

// Touch and flicker logic
let touchStartTime = null; // Track when player touches an enemy
let flickerStartTime = null; // Track when flickering starts
let isFlickering = false; // Track if player is flickering
const originalPlayerSpeed = playerSpeed; // Store original player speed for flickering

// Define bullets
const bullets = []; // Array to hold bullets
const bulletSpeed = 8; // Speed of bullets
const bulletWidth = 20; // Width of bullets
const bulletHeight = 20; // Height of bullets

// Define platforms
const platforms = [
    { x: 0, y: 500, width: 200, height: 30 },
    { x: 200, y: 400, width: 200, height: 30 },
    { x: 600, y: 300, width: 200, height: 30 }
]; // Array of platforms with x, y, width, and height

// Gravity and jumping
let playerVelY = 0; // Vertical velocity of the player
const gravity = 0.3; // Gravity strength
const jumpStrength = -10; // Jump strength when player jumps
const groundY = 550; // Y position of the ground

// Enemy waves
let enemies = []; // Array to hold enemies
let wave = 1; // Current wave number
let enemiesPerWave = 3; // Number of enemies per wave
let waveCooldown = 2000; // Cooldown time between waves in milliseconds
let lastWaveTime = Date.now(); // Last time a wave was spawned

// Enemy gravity and jumping
const enemyJumpStrength = -8; // Jump strength for enemies
let enemyVelY = 0; // Vertical velocity for enemies

// Helper function to check collision with platforms
function isOnPlatform(px, py, pw, ph) { // Check if object is on a platform
    for (let plat of platforms) {
        // Check if object is above the platform and within its width
        if (
            py + ph >= plat.y && py + ph <= plat.y + plat.height &&
            px + pw > plat.x && px < plat.x + plat.width // Check if object is within platform's width
        ) {
            return plat.y - ph; // Return the y position where object should stand
        }
    }
    return null; // Return null if not on any platform
}

// Spawn initial wave of enemies
function spawnWave() {
    for (let i = 0; i < enemiesPerWave; i++) { // Spawn enemies for the current wave
        // Randomly spawn enemies on the left or right side of the canvas
        enemies.push({
            x: Math.random() < 0.5 ? 0 : canvas.width - 50,
            y: groundY,
            width: 50,
            height: 50,
            speed: 1 + wave * 0.2,
            health: 2,
            velY: 0 // Initialize vertical velocity for the enemy
        });
    }
    wave++;
    lastWaveTime = Date.now();
}

// Update enemies' positions towards the player
function updateEnemies() {
    for (let enemy of enemies) {
        if (enemy.health > 0) { // Only update alive enemies
            // Move enemy towards player
            if (playerX < enemy.x) {
                enemy.x -= enemy.speed; // Move left towards player
            } else {
                enemy.x += enemy.speed; // Move right towards player
            }
        }
        // Check if player is above the enemy
        if (playerY < enemy.y && enemy.velY === 0) {
            enemy.velY = enemyJumpStrength;
        }
    }
}

// Handle player input
const keys = {}; // Object to track pressed keys
let canJump = true; // Flag to allow jumping
let facingLeft = false; // Track which direction the player is facing

// Handle keydown and keyup events
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        facingLeft = true;
    } // Check if player is moving left
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        facingLeft = false;
    } // Check if player is moving right

    // Allow jumping from ground or platform
    document.addEventListener('keydown', function(e) {
        let platformY = isOnPlatform(playerX, playerY, playerWidth, playerHeight); // Check if player is on a platform
        if (
            (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') &&
            (playerY >= groundY || platformY !== null) // Check if player is on the ground or a platform
        ) {
            playerVelY = jumpStrength; // Set player's vertical velocity to jump strength
        }
        keys[e.key] = true; // Mark key as pressed
    });

    // Shoot (disable if flickering)
    if (!isFlickering && (e.key === 'Enter' || e.key === 'x' || e.key === 'X')) {
        bullets.push({
            x: facingLeft ? playerX : playerX + playerWidth,
            y: playerY + playerHeight / 2 - bulletHeight / 2,
            dir: facingLeft ? -1 : 1
        }); // Add a new bullet in the direction the player is facing
    }

    keys[e.key] = true; // Mark key as pressed
});

document.addEventListener('keyup', function(e) {
    keys[e.key] = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        canJump = true; // Allow jumping again when the jump key is released
    }
});

// Main game loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].dir * bulletSpeed; // Move bullets in the direction they are facing
        if (bullets[i].x < -bulletWidth || bullets[i].x > canvas.width + bulletWidth) {
            bullets.splice(i, 1); // Remove bullets that go off screen
        }
    }

    // Draw bullets
    for (let bullet of bullets) {
        ctx.save(); // Save the current context
        ctx.translate(bullet.x, bullet.y); // Translate context to bullet position
        if (bullet.dir === -1) {
            ctx.scale(-1, 1); // Flip context for left-facing bullets
            ctx.drawImage(bulletImg, -bulletWidth, 0, bulletWidth, bulletHeight); // Draw left-facing bullet
        } else {
            ctx.drawImage(bulletImg, 0, 0, bulletWidth, bulletHeight); // Draw right-facing bullet
        }
        ctx.restore();
    }

    // Update and draw enemies
    updateEnemies(); // Update enemy positions
    for (let enemy of enemies) {
        if (enemy.health > 0) {
            ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height); // Draw enemy if it is alive
        }
    }

    // Bullet-enemy collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = 0; j < enemies.length; j++) {
            let enemy = enemies[j];
            if (
                enemy.health > 0 &&
                bullets[i].x < enemy.x + enemy.width &&
                bullets[i].x + bulletWidth > enemy.x &&
                bullets[i].y < enemy.y + enemy.height &&
                bullets[i].y + bulletHeight > enemy.y
            ) {
                bullets.splice(i, 1); // Remove bullet on collision
                enemy.health--; // Decrease enemy health
                break; // Break to avoid checking the same bullet against other enemies
            }
        }
    }

    // Player-enemy collision and flicker logic
    let touchingEnemy = false;
    for (let enemy of enemies) {
        if (
            enemy.health > 0 &&
            playerX < enemy.x + enemy.width &&
            playerX + playerWidth > enemy.x &&
            playerY < enemy.y + enemy.height &&
            playerY + playerHeight > enemy.y
        ) {
            touchingEnemy = true; // Player is touching an enemy
            break; // Break if player is touching any enemy
        }
    }
    if (touchingEnemy) {
        if (!touchStartTime) touchStartTime = Date.now();
        if (!isFlickering && Date.now() - touchStartTime >= 5000) {
            playerSpeed = originalPlayerSpeed / 2; // Reduce player speed when flickering starts
            flickerStartTime = Date.now(); // Start flickering timer
            isFlickering = true; // Set flickering state to true
        }
    } else {
        touchStartTime = null; // Reset touch start time if not touching an enemy
    }

    if (isFlickering) {
        if (Date.now() - flickerStartTime >= 2000) {
            playerSpeed = originalPlayerSpeed; // Reset player speed after flickering ends
            isFlickering = false; // Set flickering state to false
        }
    }

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

    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a']) {
        playerX -= playerSpeed; // Move player left
        facingLeft = true; // Set facing direction to left
    }
    if (keys['ArrowRight'] || keys['d']) {
        playerX += playerSpeed; // Move player right
        facingLeft = false; // Set facing direction to right
    }

    // Gravity and vertical movement
    playerVelY += gravity; // Apply gravity to player
    playerY += playerVelY; // Update player's vertical position

    // Platform collision
    let platformY = isOnPlatform(playerX, playerY, playerWidth, playerHeight);
    if (platformY !== null && playerVelY >= 0) { // Check if player is on a platform
        playerY = platformY; // Set player's vertical position to platform's top
        playerVelY = 0; // Reset vertical velocity
    }

    /*// Loop horizontally
    if (playerX + playerWidth < 0) playerX = canvas.width;
    if (playerX > canvas.width) playerX = -playerWidth;*/

    // Wall collision
    if (playerX < 0) playerX = 0; // Prevent player from going off the left edge
    if (playerX + playerWidth > canvas.width) playerX = canvas.width - playerWidth; // Prevent player from going off the right edge

    // Ground collision
    if (playerY >= groundY) { // Check if player is on the ground
        playerY = groundY; // Set player's vertical position to ground level
        playerVelY = 0; // Reset vertical velocity
    }

    // Enemy wall collision
    for (let enemy of enemies) {
        if (enemy.x < 0) enemy.x = 0; // Prevent enemy from going off the left edge
        if (enemy.x + enemy.width > canvas.width) enemy.x = canvas.width - enemy.width; // Prevent enemy from going off the right edge
    }

    // Apply gravity and vertical movement for enemies
    for (let enemy of enemies) {
        enemy.velY += gravity;
        enemy.y += enemy.velY;

        // Enemy platform or ground collision
        if (enemy.y >= groundY) {
            enemy.y = groundY;
            enemy.velY = 0;
        }

        // Platform collision for enemies
        let enemyPlatformY = isOnPlatform(enemy.x, enemy.y, enemy.width, enemy.height);
        if (enemyPlatformY !== null && enemy.velY >= 0) {
            enemy.y = enemyPlatformY;
            enemy.velY = 0;
        }
    }


    // Draw platforms
    for (let plat of platforms) {
        ctx.drawImage(platformImg, plat.x, plat.y, plat.width, plat.height); // Draw each platform
    }

    // Random enemy spawn (about 1 spawn every ~1.5 seconds on average)
    if (Math.random() < 0.01) { // 2% chance per frame (~1.2 spawns/sec at 60fps)
        enemies.push({
            x: Math.random() < 0.5 ? -50 : canvas.width + 50, // spawn off left or right
            y: groundY,
            width: 50,
            height: 50,
            speed: 1 + wave * 0.2,
            health: 2,
            velY: 0 // Initialize vertical velocity for the enemy
        }); // Add a new enemy to the array
    }

    requestAnimationFrame(draw); // Request the next frame to continue the game loop
}

// Start the game loop when the player image loads
playerImg.onload = function() {
    spawnWave();
    draw();
};