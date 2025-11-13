// ======= PARTICLE SYSTEM =======

class Particle {
  constructor(x, y, vx, vy, color, size, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;  // pixels per second
    this.vy = vy;  // pixels per second
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;  // milliseconds
    this.age = 0;
    this.dead = false;
  }

  update(deltaTime) {
    // Convert deltaTime from seconds to seconds
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Apply gravity
    this.vy += CONFIG.particles.gravity * deltaTime;

    // Age the particle
    this.age += deltaTime * 1000;  // convert to milliseconds

    if (this.age >= this.lifetime) {
      this.dead = true;
    }
  }

  draw(ctx) {
    if (this.dead) return;

    // Fade out based on lifetime
    const alpha = 1 - (this.age / this.lifetime);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * Emit shooting particles
   */
  emitShoot(x, y, direction) {
    const count = CONFIG.particles.shootCount;
    const colors = ['#ffff00', '#ff9900', '#ffcc00', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = direction === 1 ?
        random(-Math.PI / 4, Math.PI / 4) :  // Right
        random(Math.PI * 3 / 4, Math.PI * 5 / 4);  // Left

      const speed = random(100, 300);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = random(2, 4);
      const lifetime = random(200, 400);

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  /**
   * Emit hit/impact particles
   */
  emitHit(x, y, enemyType) {
    const count = CONFIG.particles.hitCount;

    // Different colors based on enemy type for variety
    const colorSchemes = [
      ['#ff0000', '#ff6600', '#ff3300'],  // Red/Orange
      ['#00ff00', '#66ff00', '#33ff00'],  // Green
      ['#0000ff', '#6600ff', '#3300ff'],  // Blue
      ['#ff00ff', '#ff66ff', '#ff33ff'],  // Magenta
      ['#ffff00', '#ffff66', '#ffff33'],  // Yellow
    ];

    const colors = colorSchemes[enemyType % colorSchemes.length];

    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(50, 200);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 100;  // Slight upward bias

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = random(2, 5);
      const lifetime = CONFIG.particles.lifetime;

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  update(deltaTime) {
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }

    // Remove dead particles
    this.particles = this.particles.filter(p => !p.dead);
  }

  draw(ctx) {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }

  clear() {
    this.particles = [];
  }
}
