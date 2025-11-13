// ======= BULLET ENTITY =======

class Bullet {
  constructor(x, y, dir, type, images) {
    const spec = CONFIG.bullets[type] || CONFIG.bullets[1];

    this.type = type;
    this.x = x;
    this.y = y;
    this.dir = dir;  // 1 for right, -1 for left
    this.width = spec.width;
    this.height = spec.height;
    this.speed = spec.speed;  // pixels per second
    this.dead = false;
    this.image = images[type];
  }

  /**
   * Update bullet position based on deltaTime
   */
  update(deltaTime) {
    this.x += this.dir * this.speed * deltaTime;
  }

  /**
   * Draw the bullet
   */
  draw(ctx) {
    if (this.dead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.dir === -1) {
      // Flip horizontally for left-facing bullets
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, -this.width, 0, this.width, this.height);
    } else {
      ctx.drawImage(this.image, 0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  /**
   * Check if bullet is off screen
   */
  isOffscreen(canvasWidth) {
    return this.x < -this.width || this.x > canvasWidth + this.width;
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
}
