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
   * Emit shooting particles (more subtle)
   */
  emitShoot(x, y, direction) {
    const count = CONFIG.particles.shootCount;
    const colors = ['#ffff00', '#ff9900', '#ffcc00', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = direction === 1 ?
        random(-Math.PI / 6, Math.PI / 6) :  // Right (narrower cone)
        random(Math.PI * 5 / 6, Math.PI * 7 / 6);  // Left (narrower cone)

      const speed = random(60, 150);  // reduced speed
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = random(1, 2);  // smaller particles
      const lifetime = random(150, 300);  // shorter lifetime

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  /**
   * Emit bullet trail particles (subtle)
   */
  emitTrail(x, y, bulletType) {
    const count = CONFIG.particles.trailCount || 2;

    // Bullet type colors (matching bullet visual themes)
    const bulletColors = {
      1: ['#ff9999', '#ffaaaa'],  // Light red
      2: ['#9999ff', '#aaaaff'],  // Light blue
      3: ['#99ff99', '#aaffaa'],  // Light green
      4: ['#ffff99', '#ffffaa'],  // Light yellow
      5: ['#ff99ff', '#ffaaff'],  // Light magenta
      6: ['#99ffff', '#aaffff'],  // Light cyan
      7: ['#ffaa99', '#ffbbaa'],  // Light orange
      8: ['#ffffff', '#eeeeee'],  // White
    };

    const colors = bulletColors[bulletType] || ['#ffffff', '#eeeeee'];

    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(10, 30);  // slow drift
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = random(1, 2);  // tiny particles
      const lifetime = random(200, 400);

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  /**
   * Emit hit/impact particles with red glow and bullet-colored particles
   */
  emitHit(x, y, bulletType) {
    const count = CONFIG.particles.hitCount;

    // Bullet type colors for hit particles
    const bulletColors = {
      1: ['#ff0000', '#ff3333', '#ff6666'],  // Red
      2: ['#0000ff', '#3333ff', '#6666ff'],  // Blue
      3: ['#00ff00', '#33ff33', '#66ff66'],  // Green
      4: ['#ffff00', '#ffff33', '#ffff66'],  // Yellow
      5: ['#ff00ff', '#ff33ff', '#ff66ff'],  // Magenta
      6: ['#00ffff', '#33ffff', '#66ffff'],  // Cyan
      7: ['#ff6600', '#ff8833', '#ffaa66'],  // Orange
      8: ['#ffffff', '#eeeeee', '#dddddd'],  // White
    };

    const colors = bulletColors[bulletType] || ['#ff0000', '#ff3333', '#ff6666'];

    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(40, 150);  // reduced speed
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 80;  // Slight upward bias

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = random(1.5, 3);  // smaller particles
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
