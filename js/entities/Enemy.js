// ======= ENEMY ENTITY =======

class Enemy extends Body {
  constructor(x, y, type, wave, enemyImages) {
    const spec = CONFIG.enemies[type];
    super(x, y, spec.width, spec.height);

    this.type = type;
    this.speed = spec.baseSpeed + (wave * CONFIG.waves.speedIncreasePerWave);  // pixels per second
    this.jumpStrength = spec.jumpStrength;  // pixels per second
    this.health = spec.baseHealth;
    this.maxHealth = spec.baseHealth;
    this.dead = false;

    // Animation - EACH ENEMY HAS ITS OWN INDEPENDENT ANIMATION STATE
    this.animation = new Animation(
      enemyImages[type] || [],
      spec.animationInterval,
      spec.animMode
    );

    this.jumpFrame = enemyImages[type].jumpFrame || null;

    // Movement state
    this.isFacingLeft = false;
    this.isMoving = false;
  }

  /**
   * Update enemy AI and movement
   */
  updateAI(player, deltaTime) {
    if (this.dead || this.health <= 0) return;

    // Dead zone to prevent flickering
    const deadZone = this.width / 4;
    this.isMoving = false;

    // Move towards player
    if (player.x < this.x - deadZone) {
      this.x -= this.speed * deltaTime;
      this.isFacingLeft = true;
      this.isMoving = true;
    } else if (player.x > this.x + deadZone) {
      this.x += this.speed * deltaTime;
      this.isFacingLeft = false;
      this.isMoving = true;
    }

    // Try to jump at player
    if (this.jumpStrength !== 0 && player.y < this.y && this.velY === 0) {
      this.velY = this.jumpStrength;
      this.isMoving = true;
    }
  }

  /**
   * Update animation independently
   */
  updateAnimation(deltaTime) {
    // Each enemy updates its OWN animation based on its OWN movement state
    this.animation.update(deltaTime, this.isMoving);
  }

  /**
   * Draw enemy with its current animation frame
   */
  draw(ctx) {
    if (this.dead || this.health <= 0) return;

    ctx.save();

    // Check if jumping (use jump frame if available)
    const isJumping = this.velY !== 0;

    if (isJumping && this.jumpFrame) {
      // Draw jump frame
      ctx.translate(this.x, this.y);
      if (this.isFacingLeft) {
        ctx.scale(-1, 1);
        ctx.drawImage(this.jumpFrame, -this.width, 0, this.width, this.height);
      } else {
        ctx.drawImage(this.jumpFrame, 0, 0, this.width, this.height);
      }
    } else {
      // Draw animated frames
      this.animation.draw(ctx, this.x, this.y, this.width, this.height, this.isFacingLeft);
    }

    ctx.restore();
  }

  /**
   * Take damage
   */
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      return true;  // Enemy died
    }
    return false;
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
