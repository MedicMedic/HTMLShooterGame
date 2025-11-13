// ======= UTILITY FUNCTIONS =======

/**
 * Check AABB (Axis-Aligned Bounding Box) collision between two rectangles
 */
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Clamp a value between min and max
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Check if an entity is standing on a platform
 * Returns the platform's top Y position if on platform, null otherwise
 */
function isOnPlatform(px, py, pw, ph, platforms) {
  for (let plat of platforms) {
    if (py + ph >= plat.y && py + ph <= plat.y + plat.height &&
      px + pw > plat.x && px < plat.x + plat.width) {
      return plat.y - ph;
    }
  }
  return null;
}

/**
 * Generate random number between min and max
 */
function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Linear interpolation
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}
