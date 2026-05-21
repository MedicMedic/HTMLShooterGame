// ======= MAIN GAME CONTROLLER =======

class Game {
  constructor(ctx, images) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.images = images;
    this.paused = false;
    this.lastFrameTime = performance.now();

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
    this.ui = new UIManager(ctx);

    // State machine — starts on main menu
    this.state = STATE.MENU;

    // These are (re)initialised in _startGame()
    this.player = null;
    this.bullets = [];
    this.enemies = [];
    this.bulletPickups = [];
    this.healthPickups = [];
    this.damageNumbers = [];
    this.unlockedBullets = new Set([1]);
    this.currentBullet = 1;
    this.wave = 0;
    this.spawner = null;
    this.score = 0;
    this.lastWaveTime = 0;

    this._wireInputs();
  }

  // ===== Input =====

  _wireInputs() {
    const prevent = ['arrowleft','arrowright','arrowup','arrowdown',' ','w','a','s','d','x','enter',
                     '1','2','3','4','5','6','7','8'];

    document.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (prevent.includes(k)) e.preventDefault();

      if (this.state === STATE.MENU) {
        if (k === 'enter' || k === ' ') this._startGame();
        if (k === 't') this.state = STATE.TUTORIAL;
        return;
      }

      if (this.state === STATE.TUTORIAL) {
        if (k === 'enter' || k === 'escape') this.state = STATE.MENU;
        return;
      }

      if (this.state === STATE.GAME_OVER) {
        if (k === 'enter' || k === ' ') this._startGame();
        if (k === 'm') { this.state = STATE.MENU; playMusic('menu'); }
        return;
      }

      if (this.state === STATE.PLAYING) {
        if (k === 'arrowleft' || k === 'a') this.player.facingLeft = true;
        if (k === 'arrowright' || k === 'd') this.player.facingLeft = false;

        if ((k === ' ' || k === 'arrowup' || k === 'w') &&
            this.physics.isGrounded(this.player) && this.canJump) {
          this.player.velY = CONFIG.player.jumpStrength;
          this.canJump = false;
          playSound('jump');
        }

        // Drop through platform (down / S)
        if (k === 'arrowdown' || k === 's') {
          const onPlat = isOnPlatform(
            this.player.x, this.player.y,
            this.player.width, this.player.height,
            CONFIG.platforms
          );
          const onGround = this.player.y >= CONFIG.player.groundY;
          if (onPlat !== null && !onGround) {
            this.playerDropTimer = 0.25;       // ignore platforms for 0.25 s
            this.player.velY = 120;            // small push so physics moves past the platform
          }
        }

        if (!this.player.isFlickering && (k === 'x' || k === 'enter')) {
          this._shoot();
        }

        // Cycle with C
        if (k === 'c') this._cycleBullet();

        // Direct number keys — only if that bullet is unlocked
        const n = parseInt(k);
        if (n >= 1 && n <= 8 && this.unlockedBullets.has(n)) this.currentBullet = n;
      }
    });

    document.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
      if (k === ' ' || k === 'arrowup' || k === 'w') this.canJump = true;
    });
  }

  // ===== Game lifecycle =====

  _startGame() {
    this.player = new Player(375, CONFIG.player.groundY);
    this.player.initSprites(this.images);

    this.bullets = [];
    this.enemies = [];
    this.bulletPickups = [];
    this.healthPickups = [];
    this.damageNumbers = [];
    this.unlockedBullets = new Set([1]);
    this.currentBullet = 1;
    this.wave = 0;
    this.spawner = null;
    this.score = 0;
    this.playerDropTimer = 0;
    this.lastWaveTime = performance.now();
    this.particles = new ParticleSystem();

    this.state = STATE.PLAYING;
    playMusic('gameplay');
    this.spawnWave();
  }

  // ===== Wave spawning (in-loop, no setInterval) =====

  spawnWave() {
    this.wave++;
    playSound('waveStart');
    const total     = CONFIG.waves.startEnemies + this.wave * 2;
    const maxIdx    = Math.min(this.wave - 1, Object.keys(CONFIG.enemies).length - 1);
    const available = Object.keys(CONFIG.enemies).slice(0, maxIdx + 1);
    const interval  = Math.max(0.4, 1.5 - this.wave * 0.1);  // seconds between spawns
    this.spawner = { total, spawned: 0, available, interval, timer: 0 };
    this.lastWaveTime = performance.now();
  }

  _updateSpawner(deltaTime) {
    if (!this.spawner) return;
    this.spawner.timer += deltaTime;
    if (this.spawner.timer < this.spawner.interval) return;
    this.spawner.timer = 0;

    const type = this.spawner.available[Math.floor(Math.random() * this.spawner.available.length)];
    const spec = CONFIG.enemies[type];
    const x    = Math.random() < 0.5 ? -spec.width : this.canvas.width;
    const y    = Math.min(CONFIG.player.groundY, this.canvas.height - spec.height);
    this.enemies.push(new Enemy(x, y, type, this.wave, this.images.enemies));

    this.spawner.spawned++;
    if (this.spawner.spawned >= this.spawner.total) this.spawner = null;
  }

  _maybeSpawnWave() {
    if (this.spawner) return;
    const hasLive = this.enemies.some(e => !e.dead && e.health > 0);
    if (hasLive) { this.lastWaveTime = performance.now(); return; }
    if (performance.now() - this.lastWaveTime >= CONFIG.waves.coolDownMs) this.spawnWave();
  }

  // ===== Shooting =====

  _cycleBullet() {
    const unlocked = [...this.unlockedBullets].sort((a, b) => a - b);
    if (!unlocked.length) return;
    const idx = unlocked.indexOf(this.currentBullet);
    this.currentBullet = unlocked[(idx + 1) % unlocked.length];
  }

  _shoot() {
    if (!this.unlockedBullets.has(this.currentBullet)) { this._cycleBullet(); return; }
    if (this.bullets.length >= CONFIG.limits.maxBulletsOnScreen) return;

    const type = this.currentBullet;
    const spec = CONFIG.bullets[type];
    if (!spec) return;

    const dir = this.player.facingLeft ? -1 : 1;
    const px  = this.player.facingLeft ? this.player.x : this.player.x + this.player.width;
    const py  = this.player.y + this.player.height / 2 - spec.height / 2;

    this.bullets.push(new Bullet(px, py, dir, type, this.images.bullets));
    this.player.setThrow();
    this.particles.emitShoot(px, py, dir);
    playSound('shoot');
  }

  // ===== Pickups =====

  _onEnemyKilled(enemy) {
    const center = enemy.getCenter();
    const dropY  = Math.min(enemy.y, CONFIG.player.groundY - 30);

    // Drop bullet pickup if that type is not yet unlocked
    const bulletType = CONFIG.enemies[enemy.type]?.dropsBullet;
    if (bulletType && !this.unlockedBullets.has(bulletType)) {
      this.bulletPickups.push(
        new BulletPickup(center.x - 12, dropY, bulletType, this.images.bullets)
      );
    }

    // Boss always drops health; other enemies have 30% chance
    const isBoss = enemy.type == 8;
    if (isBoss || Math.random() < 0.30) {
      const offset = (bulletType && !this.unlockedBullets.has(bulletType)) ? -32 : 0;
      this.healthPickups.push(new HealthPickup(center.x - 10, dropY + offset));
    }
  }

  _updatePickups(deltaTime) {
    const px = this.player.x, py = this.player.y;
    const pw = this.player.width, ph = this.player.height;

    for (const p of this.bulletPickups) {
      p.update(deltaTime);
      if (!p.collected && p.overlaps(px, py, pw, ph)) {
        p.collected = true;
        this.unlockedBullets.add(p.type);
        playSound('bulletPickup');
      }
    }
    this.bulletPickups = this.bulletPickups.filter(p => !p.collected);

    for (const h of this.healthPickups) {
      h.update(deltaTime);
      if (!h.collected && h.overlaps(px, py, pw, ph)) {
        h.collected = true;
        const gained = Math.min(h.healAmount, CONFIG.player.maxHP - this.player.hp);
        this.player.hp += gained;
        if (gained > 0) {
          this.damageNumbers.push(
            new DamageNumber(this.player.x + pw / 2, this.player.y - 10, '+' + gained, '#00FF88')
          );
        }
        playSound('healthPickup');
      }
    }
    this.healthPickups = this.healthPickups.filter(h => !h.collected);
  }

  // ===== Collisions =====

  _checkBulletEnemyCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (const enemy of this.enemies) {
        if (enemy.dead || enemy.health <= 0) continue;
        if (!aabbOverlap(bullet.x, bullet.y, bullet.width, bullet.height,
                         enemy.x, enemy.y, enemy.width, enemy.height)) continue;

        const dmg  = (DAMAGE_MATRIX[bullet.type]?.[enemy.type]) || 0;
        const died = enemy.takeDamage(dmg);

        // Floating damage number (capped)
        if (this.damageNumbers.length < CONFIG.limits.maxDamageNumbers) {
          const c = enemy.getCenter();
          this.damageNumbers.push(new DamageNumber(c.x, enemy.y, dmg));
        }

        if (died) {
          this.score += 10;
          this._onEnemyKilled(enemy);
          playSound('enemyDeath');
        } else {
          playSound('hit');
        }

        const c = enemy.getCenter();
        this.particles.emitHit(c.x, c.y, bullet.type);

        bullet.dead = true;
        this.bullets.splice(i, 1);
        break;
      }
    }
  }

  _checkPlayerEnemyCollisions() {
    let touching = false;
    const now    = Date.now();

    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.health <= 0) continue;
      if (!aabbOverlap(this.player.x, this.player.y, this.player.width, this.player.height,
                       enemy.x, enemy.y, enemy.width, enemy.height)) continue;

      touching = true;
      const damaged = this.player.takeTouchDamage(now);

      if (damaged) {
        playSound('playerHurt');
        if (this.player.hp <= 0) {
          this.player.lives--;
          if (this.player.lives > 0) {
            this.player.hp = CONFIG.player.maxHP;
            this.player.setInvulnerableForRespawn();
          } else {
            this.state = STATE.GAME_OVER;
            playSound('gameOver');
            playMusic(null);
          }
        }
      }
    }

    this.player.updateFlicker(touching);
  }

  // ===== Update =====

  update(deltaTime) {
    if (this.state !== STATE.PLAYING) return;

    this.player.updateMovement(this.keys, deltaTime);
    this.physics.clampHorizontal(this.player);

    // While dropping through a platform, skip platform collision
    if (this.playerDropTimer > 0) {
      this.playerDropTimer -= deltaTime;
      this.physics.applyGravity(this.player, CONFIG.player.gravity, deltaTime);
      this.physics.clampToGround(this.player);
    } else {
      this.physics.updateEntity(this.player, CONFIG.player.gravity, deltaTime);
    }

    this.player.updateJumpState(this.physics.isGrounded(this.player));
    this.player.updateAnimation(deltaTime);

    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.health <= 0) continue;
      enemy.updateAI(this.player, deltaTime);
      this.physics.updateEntity(enemy, CONFIG.player.gravity, deltaTime);
      this.physics.clampHorizontal(enemy);
      enemy.updateAnimation(deltaTime);
    }

    for (const bullet of this.bullets) {
      bullet.update(deltaTime);
      if (bullet.shouldEmitTrail()) {
        const c = bullet.getCenter();
        this.particles.emitTrail(c.x, c.y, bullet.type);
      }
    }
    this.bullets = this.bullets.filter(b => !b.isOffscreen(this.canvas.width) && !b.dead);

    this.particles.update(deltaTime);

    for (const d of this.damageNumbers) d.update(deltaTime);
    this.damageNumbers = this.damageNumbers.filter(d => !d.isDead());

    this._checkBulletEnemyCollisions();
    this._checkPlayerEnemyCollisions();
    this._updatePickups(deltaTime);
    this._updateSpawner(deltaTime);
    this._maybeSpawnWave();

    this.enemies = this.enemies.filter(e => !e.dead);
  }

  // ===== Draw =====

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === STATE.MENU) {
      this.ui.drawMenu();
      return;
    }
    if (this.state === STATE.TUTORIAL) {
      this.ui.drawTutorial(this.images.bullets);
      return;
    }

    // Playing scene (drawn for both PLAYING and GAME_OVER)
    for (const plat of CONFIG.platforms) {
      this.ctx.drawImage(this.images.platform, plat.x, plat.y, plat.width, plat.height);
    }

    for (const p of this.bulletPickups) p.draw(this.ctx);
    for (const h of this.healthPickups) h.draw(this.ctx);
    for (const bullet of this.bullets)  bullet.draw(this.ctx);
    this.particles.draw(this.ctx);
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
      this.ui.drawEnemyHPBar(enemy);
    }
    this.player.draw(this.ctx);
    for (const d of this.damageNumbers) d.draw(this.ctx);

    // HUD
    this.ui.drawPlayerHPBar(this.player.getHP(), CONFIG.player.maxHP);
    this.ui.drawLivesIndicator(this.player.getLives());
    this.ui.drawScoreIndicator(this.score);
    this.ui.drawWaveIndicator(this.wave);
    this.ui.drawBulletHUD(this.currentBullet, this.unlockedBullets, this.images.bullets);

    if (this.state === STATE.GAME_OVER) {
      this.ui.drawGameOver(this.score);
    }
  }

  // ===== Frame loop =====

  frame(currentTime) {
    if (this.paused) {
      requestAnimationFrame(ts => this.frame(ts));
      return;
    }

    const rawDt = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    const deltaTime = Math.min(rawDt, 0.05);  // cap at 50ms (prevents spiral-of-death)

    this.update(deltaTime);
    this.draw();
    requestAnimationFrame(ts => this.frame(ts));
  }

  start() {
    playMusic('menu');
    requestAnimationFrame(ts => this.frame(ts));
  }
}
