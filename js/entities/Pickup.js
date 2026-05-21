// ======= PICKUP ENTITIES =======

class BulletPickup {
  constructor(x, y, type, bulletImages) {
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.type = type;
    this.width = 24;
    this.height = 24;
    this.image = bulletImages[type] || null;
    this.time = Math.random() * Math.PI * 2;  // random bob phase
    this.collected = false;
  }

  update(deltaTime) {
    this.time += 3 * deltaTime;
    this.y = this.baseY + Math.sin(this.time) * 6;
  }

  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12 + Math.sin(this.time * 2) * 4;
    if (this.image) ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  overlaps(px, py, pw, ph) {
    return aabbOverlap(this.x, this.y, this.width, this.height, px, py, pw, ph);
  }
}

class HealthPickup {
  constructor(x, y) {
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.time = Math.random() * Math.PI * 2;
    this.collected = false;
    this.healAmount = 25;
  }

  update(deltaTime) {
    this.time += 3 * deltaTime;
    this.y = this.baseY + Math.sin(this.time) * 6;
  }

  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 12 + Math.sin(this.time * 2) * 4;

    // Use sprite if available, otherwise draw a procedural cross
    if (IMAGES.healthPickup) {
      ctx.drawImage(IMAGES.healthPickup, this.x, this.y, this.width, this.height);
    } else {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      ctx.fillStyle = '#00FF88';
      ctx.fillRect(cx - 3, cy - 9, 6, 18);
      ctx.fillRect(cx - 9, cy - 3, 18, 6);
    }

    ctx.restore();
  }

  overlaps(px, py, pw, ph) {
    return aabbOverlap(this.x, this.y, this.width, this.height, px, py, pw, ph);
  }
}
