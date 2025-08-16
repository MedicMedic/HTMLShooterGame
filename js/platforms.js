// platforms.js

// Load platform image
const platformImg = new Image(); // Ensure the platform image is defined
platformImg.src = 'assets/environment/PHplatform.png'; // Ensure the platform image path is correct

// Define platforms
const platforms = [
    { x: 0, y: 500, width: 200, height: 30 },
    { x: 200, y: 400, width: 200, height: 30 },
    { x: 600, y: 300, width: 200, height: 30 }
]; // Array of platforms with x, y, width, and height

function drawPlatforms(ctx) { // Draw all platforms on the canvas    // Draw platforms
    for (let plat of platforms) {
        ctx.drawImage(platformImg, plat.x, plat.y, plat.width, plat.height); // Draw each platform
    }
}

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