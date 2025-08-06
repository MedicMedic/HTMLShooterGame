const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load player image
const playerImg = new Image();
playerImg.src = 'assets/player/PHplayer.png';

// Load bullet image
const bulletImg = new Image();
bulletImg.src = 'assets/bullets/PHbullet.png';

// Load enemy image
const enemyImg = new Image();
enemyImg.src = 'assets/enemies/PHenemy.png';

let playerX = 375;
let playerY = 525;
const playerWidth = 50;
const playerHeight = 50;
let playerSpeed = 5;

let touchStartTime = null;
let flickerStartTime = null;
let isFlickering = false;
const originalPlayerSpeed = playerSpeed;

const bullets = [];
const bulletSpeed = 8;
const bulletWidth = 20;
const bulletHeight = 20;

// Gravity and jumping
let playerVelY = 0;
const gravity = 0.3;
const jumpStrength = -10;
const groundY = 550;

// Enemy waves
let enemies = [];
let wave = 1;
let enemiesPerWave = 3;
let waveCooldown = 2000;
let lastWaveTime = Date.now();

function spawnWave() {
    for (let i = 0; i < enemiesPerWave; i++) {
        enemies.push({
            x: Math.random() < 0.5 ? 0 : canvas.width - 50,
            y: groundY,
            width: 50,
            height: 50,
            speed: 1 + wave * 0.2,
            health: 2
        });
    }
    wave++;
    lastWaveTime = Date.now();
}

function updateEnemies() {
    for (let enemy of enemies) {
        if (enemy.health > 0) {
            if (enemy.x < playerX) enemy.x += enemy.speed;
            else if (enemy.x > playerX) enemy.x -= enemy.speed;
            enemy.y = groundY;
        }
    }
}

const keys = {};
let canJump = true;
let facingLeft = false;

document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        facingLeft = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        facingLeft = false;
    }

    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && playerY >= groundY && canJump) {
        playerVelY = jumpStrength;
        canJump = false;
    }

    // Shoot (disable if flickering)
    if (!isFlickering && (e.key === 'Enter' || e.key === 'x' || e.key === 'X')) {
        bullets.push({
            x: facingLeft ? playerX : playerX + playerWidth,
            y: playerY + playerHeight / 2 - bulletHeight / 2,
            dir: facingLeft ? -1 : 1
        });
    }

    keys[e.key] = true;
});

document.addEventListener('keyup', function(e) {
    keys[e.key] = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        canJump = true;
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].dir * bulletSpeed;
        if (bullets[i].x < -bulletWidth || bullets[i].x > canvas.width + bulletWidth) {
            bullets.splice(i, 1);
        }
    }

    // Draw bullets
    for (let bullet of bullets) {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        if (bullet.dir === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(bulletImg, -bulletWidth, 0, bulletWidth, bulletHeight);
        } else {
            ctx.drawImage(bulletImg, 0, 0, bulletWidth, bulletHeight);
        }
        ctx.restore();
    }

    // Update and draw enemies
    updateEnemies();
    for (let enemy of enemies) {
        if (enemy.health > 0) {
            ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
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
                bullets.splice(i, 1);
                enemy.health--;
                break;
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
            touchingEnemy = true;
            break;
        }
    }
    if (touchingEnemy) {
        if (!touchStartTime) touchStartTime = Date.now();
        if (!isFlickering && Date.now() - touchStartTime >= 5000) {
            playerSpeed = originalPlayerSpeed / 2;
            flickerStartTime = Date.now();
            isFlickering = true;
        }
    } else {
        touchStartTime = null;
    }

    if (isFlickering) {
        if (Date.now() - flickerStartTime >= 2000) {
            playerSpeed = originalPlayerSpeed;
            isFlickering = false;
        }
    }

    // Flicker drawing (player flickers if isFlickering)
    ctx.save();
    ctx.translate(playerX, playerY);
    if (facingLeft) {
        ctx.scale(-1, 1);
        if (!isFlickering || Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.drawImage(playerImg, -playerWidth, 0, playerWidth, playerHeight);
        }
    } else {
        if (!isFlickering || Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.drawImage(playerImg, 0, 0, playerWidth, playerHeight);
        }
    }
    ctx.restore();

    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a']) {
        playerX -= playerSpeed;
        facingLeft = true;
    }
    if (keys['ArrowRight'] || keys['d']) {
        playerX += playerSpeed;
        facingLeft = false;
    }

    // Gravity and vertical movement
    playerVelY += gravity;
    playerY += playerVelY;

    /*// Loop horizontally
    if (playerX + playerWidth < 0) playerX = canvas.width;
    if (playerX > canvas.width) playerX = -playerWidth;*/

    // Ground collision
    if (playerY >= groundY) {
        playerY = groundY;
        playerVelY = 0;
    }

    // Random enemy spawn (about 1 spawn every ~1.5 seconds on average)
    if (Math.random() < 0.01) { // 2% chance per frame (~1.2 spawns/sec at 60fps)
        enemies.push({
            x: Math.random() < 0.5 ? -50 : canvas.width + 50, // spawn off left or right
            y: groundY,
            width: 50,
            height: 50,
            speed: 1 + wave * 0.2,
            health: 2
        });
    }

    requestAnimationFrame(draw);
}

// Start the game loop when the player image loads
playerImg.onload = function() {
    spawnWave();
    draw();
};