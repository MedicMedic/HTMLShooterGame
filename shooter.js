const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImg = new Image();
playerImg.src = 'assets/player/PHplayer.png';

let playerX = 375;
let playerY = 525;
const playerWidth = 50;
const playerHeight = 50;
const playerSpeed = 5;

// Gravity and jumping
let playerVelY = 10;
const gravity = 0.3;
const jumpStrength = -10;
const groundY = 550; // Y position of the ground (canvas height - playerHeight)

const keys = {};

let canJump = true;

document.addEventListener('keydown', function(e) {
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && playerY >= groundY && canJump) {
        playerVelY = jumpStrength;
        canJump = false; // Prevent repeated jumps while holding
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

let facingLeft = false;

function draw() {
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (facingLeft) {
        ctx.translate(playerX + playerWidth, playerY);
        ctx.scale(-1, 1);
        ctx.drawImage(playerImg, 0, 0, playerWidth, playerHeight);
    } else {
        ctx.drawImage(playerImg, playerX, playerY, playerWidth, playerHeight);
    }
    ctx.restore();

    requestAnimationFrame(draw);
}

playerImg.onload = function() {
    draw();
};