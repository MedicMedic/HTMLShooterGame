// ======= PLAYER ENTITY =======

class Player extends Body {
  constructor(x, y) {
    super(x, y, CONFIG.player.width, CONFIG.player.height);

    this.baseSpeed = CONFIG.player.speed;  // pixels per second
    this.speed = this.baseSpeed;

    // State
    this.facingLeft = false;
    this.isFlickering = false;
    this.isJumping = false;
    this.isMoving = false;

    // Combat
    this.hp = CONFIG.player.maxHP;
    this.lives = CONFIG.player.lives;
    this.invulnUntil = 0;
    this.lastHurtAt = 0;

    // Flicker state
    this.touchStartTime = null;
    this.flickerStartTime = null;

    // Throw animation
    this.throwUntil = 0;

    // Animation controller
    this.animController = new AnimationController();
  }

  /**
   * Initialize player sprites (called after images are loaded)
   */
  initSprites(images) {
    // Idle animation
    this.idleSprite = new Image();
    this.idleSprite.src = CONFIG.sprites.player;

    // Walking animation
    const walkFrames = [];
    for (const src of CONFIG.sprites.playerWalk) {
      const img = new Image();
      img.src = src;
      walkFrames.push(img);
    }
    this.animController.addAnimation('walk', walkFrames, 120, 'step');

    // Jump sprite
    this.jumpSprite = new Image();
    this.jumpSprite.src = CONFIG.sprites.playerJump;

    // Throw sprite
    this.throwSprite = new Image();
    this.throwSprite.src = CONFIG.sprites.playerThrow;

    // Set initial animation
    this.animController.setAnimation('walk');
  }

  /**
   * Set throw state (called when player shoots)
   */
  setThrow() {
    this.throwUntil = Date.now() + 250;  // 250ms throw animation
  }

  /**
   * Check if currently in throw animation
   */
  isThrowing() {
    return Date.now() < this.throwUntil;
  }

  /**
   * Update movement based on input
   */
  updateMovement(keys, deltaTime) {
    this.isMoving = false;

    if (keys['arrowleft'] || keys['a']) {
      this.x -= this.speed * deltaTime;
      this.facingLeft = true;
      this.isMoving = true;
    }
    if (keys['arrowright'] || keys['d']) {
      this.x += this.speed * deltaTime;
      this.facingLeft = false;
      this.isMoving = true;
    }
  }

  /**
   * Update animation based on state
   */
  updateAnimation(deltaTime) {
    // Update walking animation only when moving
    this.animController.update(deltaTime, this.isMoving);
  }

  /**
   * Update jump state (whether player is in air)
   */
  updateJumpState(grounded) {
    this.isJumping = !grounded;
  }

  /**
   * Update flicker effect
   */
  updateFlicker(touching) {
    const { holdMs, durationMs, slowFactor } = CONFIG.player.flicker;

    if (touching) {
      if (!this.touchStartTime) {
        this.touchStartTime = Date.now();
      }

      if (!this.isFlickering && Date.now() - this.touchStartTime >= holdMs) {
        this.isFlickering = true;
        this.flickerStartTime = Date.now();
        this.speed = this.baseSpeed * slowFactor;
      }
    } else {
      this.touchStartTime = null;
    }

    if (this.isFlickering && Date.now() - this.flickerStartTime >= durationMs) {
      this.isFlickering = false;
      this.speed = this.baseSpeed;
    }
  }

  /**
   * Take touch damage from enemy
   */
  takeTouchDamage(now) {
    if (now < this.invulnUntil) return false;

    if (now - this.lastHurtAt >= CONFIG.combat.touchDamageCooldown) {
      this.hp -= CONFIG.combat.touchDamage;
      this.lastHurtAt = now;
      return true;
    }

    return false;
  }

  /**
   * Set invulnerability (for respawn)
   */
  setInvulnerableForRespawn() {
    this.invulnUntil = Date.now() + CONFIG.player.respawnInvulnMs;
  }

  /**
   * Draw player with current animation/state
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flicker effect
    const invuln = Date.now() < this.invulnUntil;
    const shouldFlicker =
      (this.isFlickering && Math.floor(Date.now() / 100) % 2 === 0) ||
      (invuln && Math.floor(Date.now() / 100) % 2 === 0);

    if (shouldFlicker) {
      ctx.restore();
      return;
    }

    // Choose sprite based on state priority
    let sprite;
    if (this.isThrowing()) {
      sprite = this.throwSprite;
    } else if (this.isJumping) {
      sprite = this.jumpSprite;
    } else if (this.isMoving) {
      sprite = this.animController.getCurrentFrame();
    } else {
      sprite = this.idleSprite;
    }

    // Flip if facing left
    if (this.facingLeft) {
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -this.width, 0, this.width, this.height);
    } else {
      ctx.drawImage(sprite, 0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  /**
   * Get current HP
   */
  getHP() {
    return this.hp;
  }

  /**
   * Get current lives
   */
  getLives() {
    return this.lives;
  }
}
