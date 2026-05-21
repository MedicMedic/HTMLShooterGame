// ======= BASE PHYSICS BODY =======

class Body {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velX = 0;  // pixels per second
    this.velY = 0;  // pixels per second
  }

  /**
   * Get bounding box for collision detection
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Check collision with another body
   */
  collidesWith(other) {
    return aabbOverlap(
      this.x, this.y, this.width, this.height,
      other.x, other.y, other.width, other.height
    );
  }

  /**
   * Get center position
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }
}
