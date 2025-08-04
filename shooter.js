const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImg = new Image();
playerImg.src = 'assets/player/PHplayer.png';

// Load bullet image
const bulletImg = new Image();
bulletImg.src = 'assets/bullets/PHbullet.png';

let playerX = 375;
let playerY = 525;
const playerWidth = 50;
const playerHeight = 50;
const playerSpeed = 5;

const bullets = [];
const bulletSpeed = 10;
const bulletWidth = 20; // Set to your bullet image's width
const bulletHeight = 10; // Set to your bullet image's height

// Gravity and jumping
let playerVelY = 0;
const gravity = 0.3;
const jumpStrength = -10;
const groundY = 550; // Y position of the ground (canvas height - playerHeight)

const keys = {};

let canJump = true;
let facingLeft = false; // Track direction for flipping and shooting

document.addEventListener('keydown', function(e) {
    // Jump
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && playerY >= groundY && canJump) {
        playerVelY = jumpStrength;
        canJump = false;
    }

    // Shoot
    if ((e.key === 'Enter' || e.key === 'x' || e.key === 'X')) {
        bullets.push({
            x: facingLeft ? playerX : playerX + playerWidth,
            y: playerY + playerHeight / 2 - bulletHeight / 2,
            dir: facingLeft ? -1 : 1
        });
    }

    // Only update facingLeft when moving left/right
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        facingLeft = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        facingLeft = false;
    }

    keys[e.key] = true;
});

document.addEventListener('keyup', function(e) {
    keys[e.key] = false;
    // Allow jumping again when jump key is released
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

    // Loop horizontally
    if (playerX + playerWidth < 0) playerX = canvas.width;
    if (playerX > canvas.width) playerX = -playerWidth;

    // Ground collision
    if (playerY >= groundY) {
        playerY = groundY;
        playerVelY = 0;
    }

    // Draw player
    ctx.save();
    ctx.translate(playerX, playerY);
    if (facingLeft) {
        ctx.scale(-1, 1);
        ctx.drawImage(playerImg, -playerWidth, 0, playerWidth, playerHeight);
    } else {
        ctx.drawImage(playerImg, 0, 0, playerWidth, playerHeight);
    }
    ctx.restore();

    requestAnimationFrame(draw);
}

// Start the game loop when the player image loads
playerImg.onload = function() {
    draw();
};