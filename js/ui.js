// ======= UI SYSTEM =======

class UIManager {
  constructor(ctx, scoreEl, livesEl) {
    this.ctx = ctx;
    this.scoreEl = scoreEl;
    this.livesEl = livesEl;
  }

  /**
   * Draw HP bar above an entity
   */
  drawHPBar(x, y, width, height, currentHP, maxHP, showBorder = true) {
    const barWidth = width;
    const barHeight = 6;
    const barY = y - barHeight - 4;  // 4px above entity

    // Background (empty bar)
    this.ctx.fillStyle = '#000000';
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillRect(x, barY, barWidth, barHeight);
    this.ctx.globalAlpha = 1.0;

    // Calculate HP percentage
    const hpPercent = clamp(currentHP / maxHP, 0, 1);

    // HP fill color (gradient from green to red)
    let fillColor;
    if (hpPercent > 0.6) {
      fillColor = '#00ff00';  // Green
    } else if (hpPercent > 0.3) {
      fillColor = '#ffff00';  // Yellow
    } else {
      fillColor = '#ff0000';  // Red
    }

    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(x, barY, barWidth * hpPercent, barHeight);

    // Border
    if (showBorder) {
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, barY, barWidth, barHeight);
    }
  }

  /**
   * Draw prominent player HP bar at top of screen
   */
  drawPlayerHPBar(currentHP, maxHP, x = 20, y = 20) {
    const barWidth = 200;
    const barHeight = 20;

    // Label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText('PLAYER HP', x, y - 5);

    // Background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(x, y, barWidth, barHeight);

    // Calculate HP percentage
    const hpPercent = clamp(currentHP / maxHP, 0, 1);

    // HP fill with gradient
    const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);

    if (hpPercent > 0.6) {
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(1, '#00cc00');
    } else if (hpPercent > 0.3) {
      gradient.addColorStop(0, '#ffff00');
      gradient.addColorStop(1, '#ffaa00');
    } else {
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(1, '#cc0000');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, barWidth, barHeight);

    // HP text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${Math.max(0, Math.floor(currentHP))} / ${maxHP}`,
      x + barWidth / 2,
      y + barHeight / 2 + 4
    );
    this.ctx.textAlign = 'left';
  }

  /**
   * Draw enemy HP bar (smaller, above enemy)
   */
  drawEnemyHPBar(enemy) {
    if (enemy.dead || enemy.health <= 0) return;

    this.drawHPBar(
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height,
      enemy.health,
      enemy.maxHealth,
      true
    );
  }

  /**
   * Update external HUD elements (score, lives)
   */
  updateHUD(score, lives) {
    if (this.scoreEl) {
      this.scoreEl.textContent = `Score: ${score}`;
    }
    if (this.livesEl) {
      this.livesEl.textContent = `Lives: ${Math.max(0, lives)}`;
    }
  }

  /**
   * Draw game over screen
   */
  drawGameOver() {
    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Game Over text
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'GAME OVER',
      this.ctx.canvas.width / 2,
      this.ctx.canvas.height / 2
    );

    this.ctx.restore();
  }

  /**
   * Draw wave indicator
   */
  drawWaveIndicator(wave, x = 650, y = 30) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Wave: ${wave}`, x, y);
    this.ctx.textAlign = 'left';
  }

  /**
   * Draw current bullet type indicator with image in top HUD
   */
  drawBulletIndicator(bulletType, bulletImage, x = 250, y = 20) {
    // Label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText('BULLET TYPE', x, y - 5);

    // Background box
    const boxWidth = 60;
    const boxHeight = 60;
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(x, y, boxWidth, boxHeight);

    // Draw bullet image centered in box
    if (bulletImage) {
      const padding = 10;
      const imgSize = boxWidth - padding * 2;
      this.ctx.drawImage(
        bulletImage,
        x + padding,
        y + padding,
        imgSize,
        imgSize
      );
    }

    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Bullet number below
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `[${bulletType}]`,
      x + boxWidth / 2,
      y + boxHeight + 15
    );
    this.ctx.textAlign = 'left';
  }
}
