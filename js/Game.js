// ======= MAIN GAME CONTROLLER =======

class Game {
  constructor(ctx, images) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.images = images;

    // Input
    this.keys = {};
    this.canJump = true;

    // Systems
    this.physics = new PhysicsEngine(
      CONFIG.platforms,
      CONFIG.player.groundY,
      this.canvas.width,
      this.canvas.height
    );
    this.particles = new ParticleSystem();
    this.ui = new UIManager(
      ctx,
      document.getElementById('score'),
      document.getElementById('lives')
    );

    // Entities
    this.player = new Player(375, CONFIG.player.groundY);
    this.player.initSprites(images);
    this.bullets = [];
    this.enemies = [];

    // Game state
    this.currentBullet = 1;
    this.wave = 0;
    this.enemiesRemaining = 0;
    this.waveInProgress = false;
    this.score = 0;
    this.gameOver = false;
    this.lastWaveTime = Date.now();

    // Delta time tracking
    this.lastFrameTime = performance.now();

    this._wireInputs();
    this.ui.updateHUD(this.score, this.player.getLives());
  }

  /**
   * Setup input handlers
   */
  _wireInputs() {
    const prevent = ['arrowleft', 'arrowright', 'arrowup', ' ', 'w', 'a', 's', 'd', 'x', 'enter', '1', '2', '3', '4', '5', '6', '7', '8'];

    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      if (prevent.includes(k)) e.preventDefault();

      // Jump
      if ((k === ' ' || k === 'arrowup' || k === 'w') &&
        this.physics.isGrounded(this.player) && this.canJump) {
        this.player.velY = CONFIG.player.jumpStrength;
        this.canJump = false;
      }

      // Shoot
      if (!this.player.isFlickering && (k === 'x' || k === 'enter')) {
        this._shoot(this.currentBullet);
      }

      // Direct bullet selection with 1-8 keys
      const bulletNum = parseInt(k);
      if (bulletNum >= 1 && bulletNum <= 8 && CONFIG.bulletTypes.includes(bulletNum)) {
        this.currentBullet = bulletNum;
      }

      // Cycle bullet type (keep for backwards compatibility)
      if (k === 'c') {
        const idx = CONFIG.bulletTypes.indexOf(this.currentBullet);
        this.currentBullet = CONFIG.bulletTypes[(idx + 1) % CONFIG.bulletTypes.length];
      }
    });

    document.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;

      if (k === ' ' || k === 'arrowup' || k === 'w') {
        this.canJump = true;
      }
    });
  }

  /**
   * Shoot bullet
   */
  _shoot(type) {
    const spec = CONFIG.bullets[type];
    if (!spec) return;

    const dir = this.player.facingLeft ? -1 : 1;
    const px = this.player.facingLeft ? this.player.x : this.player.x + this.player.width;
    const py = this.player.y + this.player.height / 2 - spec.height / 2;

    this.bullets.push(new Bullet(px, py, dir, type, this.images.bullets));
    this.player.setThrow();

    // Emit shoot particles
    this.particles.emitShoot(px, py, dir);
  }

  /**
   * Spawn new wave of enemies
   */
  spawnWave() {
    this.wave++;
    this.waveInProgress = true;

    const total = CONFIG.waves.startEnemies + this.wave * 2;
    this.enemiesRemaining = total;

    const enemyKeys = Object.keys(CONFIG.enemies);
    const maxIndex = Math.min(this.wave - 1, enemyKeys.length - 1);
    const available = enemyKeys.slice(0, maxIndex + 1);

    let spawned = 0;
    const interval = setInterval(() => {
      if (spawned >= total) {
        clearInterval(interval);
        this.waveInProgress = false;
        return;
      }

      const type = available[Math.floor(Math.random() * available.length)];
      const spec = CONFIG.enemies[type];
      const sideLeft = Math.random() < 0.5;
      const x = sideLeft ? -spec.width : this.canvas.width;

      let y = CONFIG.player.groundY;
      if (CONFIG.player.groundY + spec.height > this.canvas.height) {
        y = this.canvas.height - spec.height;
      }

      this.enemies.push(new Enemy(x, y, type, this.wave, this.images.enemies));
      spawned++;
      this.enemiesRemaining--;
    }, Math.max(400, 1500 - this.wave * 100));

    this.lastWaveTime = Date.now();
  }

  /**
   * Update game state
   */
  update(deltaTime) {
    if (this.gameOver) return;

    // Update player movement
    this.player.updateMovement(this.keys, deltaTime);
    this.physics.clampHorizontal(this.player);

    // Update player physics
    this.physics.updateEntity(this.player, CONFIG.player.gravity, deltaTime);
    this.player.updateJumpState(this.physics.isGrounded(this.player));

    // Update player animation
    this.player.updateAnimation(deltaTime);

    // Update enemies - EACH ENEMY UPDATES INDEPENDENTLY
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.health <= 0) continue;

      // Update AI and movement
      enemy.updateAI(this.player, deltaTime);

      // Update physics
      this.physics.updateEntity(enemy, CONFIG.player.gravity, deltaTime);
      this.physics.clampHorizontal(enemy);

      // Update animation - INDEPENDENT FOR EACH ENEMY
      enemy.updateAnimation(deltaTime);
    }

    // Update bullets and emit trail particles
    for (const bullet of this.bullets) {
      bullet.update(deltaTime);

      // Emit trail particles
      if (bullet.shouldEmitTrail()) {
        const center = bullet.getCenter();
        this.particles.emitTrail(center.x, center.y, bullet.type);
      }
    }
    this.bullets = this.bullets.filter(b => !b.isOffscreen(this.canvas.width) && !b.dead);

    // Update particles
    this.particles.update(deltaTime);

    // Check collisions
    this._checkBulletEnemyCollisions();
    this._checkPlayerEnemyCollisions();

    // Wave management
    this._maybeSpawnWave();

    // Clean up dead enemies
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  /**
   * Check bullet-enemy collisions
   */
  _checkBulletEnemyCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let hit = false;

      for (const enemy of this.enemies) {
        if (enemy.dead || enemy.health <= 0) continue;

        if (aabbOverlap(
          bullet.x, bullet.y, bullet.width, bullet.height,
          enemy.x, enemy.y, enemy.width, enemy.height
        )) {
          // Apply damage based on damage matrix
          const dmg = (DAMAGE_MATRIX[bullet.type] && DAMAGE_MATRIX[bullet.type][enemy.type]) || 0;
          const died = enemy.takeDamage(dmg);

          if (died) {
            this.score += 10;
            this.ui.updateHUD(this.score, this.player.getLives());
          }

          // Emit hit particles with bullet color
          const center = enemy.getCenter();
          this.particles.emitHit(center.x, center.y, bullet.type);

          bullet.dead = true;
          hit = true;
          break;
        }
      }

      if (hit) {
        this.bullets.splice(i, 1);
      }
    }
  }

  /**
   * Check player-enemy collisions
   */
  _checkPlayerEnemyCollisions() {
    let touching = false;
    const now = Date.now();

    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.health <= 0) continue;

      if (aabbOverlap(
        this.player.x, this.player.y, this.player.width, this.player.height,
        enemy.x, enemy.y, enemy.width, enemy.height
      )) {
        touching = true;
        const damaged = this.player.takeTouchDamage(now);

        if (damaged && this.player.hp <= 0) {
          this.player.lives--;

          if (this.player.lives > 0) {
            this.player.hp = CONFIG.player.maxHP;
            this.player.setInvulnerableForRespawn();
          } else {
            this.gameOver = true;
          }

          this.ui.updateHUD(this.score, this.player.getLives());
        }
      }
    }

    this.player.updateFlicker(touching);
  }

  /**
   * Check if should spawn new wave
   */
  _maybeSpawnWave() {
    const alive = this.enemies.some(e => !e.dead && e.health > 0);
    const timeSince = Date.now() - this.lastWaveTime;

    if (!alive && !this.waveInProgress && timeSince >= CONFIG.waves.coolDownMs) {
      this.spawnWave();
    }
  }

  /**
   * Draw all game elements
   */
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw platforms
    for (const plat of CONFIG.platforms) {
      this.ctx.drawImage(
        this.images.platform,
        plat.x, plat.y,
        plat.width, plat.height
      );
    }

    // Draw bullets
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    // Draw particles
    this.particles.draw(this.ctx);

    // Draw enemies with HP bars
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
      this.ui.drawEnemyHPBar(enemy);
    }

    // Draw player
    this.player.draw(this.ctx);

    // Draw UI
    this.ui.drawPlayerHPBar(this.player.getHP(), CONFIG.player.maxHP);
    this.ui.drawWaveIndicator(this.wave);
    this.ui.drawBulletIndicator(this.currentBullet, this.images.bullets[this.currentBullet]);

    // Draw game over
    if (this.gameOver) {
      this.ui.drawGameOver();
    }
  }

  /**
   * Main game loop
   */
  frame(currentTime) {
    // Calculate deltaTime in seconds
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Cap deltaTime to prevent spiral of death
    const cappedDeltaTime = Math.min(deltaTime, 0.1);

    // Update and draw
    this.update(cappedDeltaTime);
    this.draw();

    // Continue loop if not game over
    if (!this.gameOver) {
      requestAnimationFrame((time) => this.frame(time));
    } else {
      this.ui.updateHUD(this.score, this.player.getLives());
    }
  }

  /**
   * Start the game
   */
  start() {
    this.spawnWave();
    requestAnimationFrame((time) => this.frame(time));
  }
}
