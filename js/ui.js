// ======= UI SYSTEM =======

class UIManager {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // ===== Generic HP bar (used for enemies) =====

  drawHPBar(x, y, width, currentHP, maxHP) {
    const bh  = 6;
    const by  = y - bh - 4;
    const pct = clamp(currentHP / maxHP, 0, 1);
    const fill = pct > 0.6 ? '#00ff00' : pct > 0.3 ? '#ffff00' : '#ff0000';

    this.ctx.globalAlpha = 0.55;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x, by, width, bh);
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x, by, width * pct, bh);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, by, width, bh);
  }

  // ===== Playing HUD =====

  drawPlayerHPBar(currentHP, maxHP, x = 20, y = 20) {
    const bw = 200, bh = 20;
    const pct = clamp(currentHP / maxHP, 0, 1);

    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('PLAYER HP', x, y - 5);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, y, bw, bh);

    const g = this.ctx.createLinearGradient(x, y, x + bw, y);
    if (pct > 0.6)      { g.addColorStop(0, '#00ff00'); g.addColorStop(1, '#00cc00'); }
    else if (pct > 0.3) { g.addColorStop(0, '#ffff00'); g.addColorStop(1, '#ffaa00'); }
    else                { g.addColorStop(0, '#ff0000'); g.addColorStop(1, '#cc0000'); }

    this.ctx.fillStyle = g;
    this.ctx.fillRect(x, y, bw * pct, bh);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, bw, bh);

    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.max(0, Math.floor(currentHP))} / ${maxHP}`, x + bw / 2, y + bh / 2 + 4);
    this.ctx.textAlign = 'left';
  }

  drawEnemyHPBar(enemy) {
    if (enemy.dead || enemy.health <= 0 || enemy.health >= enemy.maxHealth) return;
    this.drawHPBar(enemy.x, enemy.y, enemy.width, enemy.health, enemy.maxHealth);
  }

  drawLivesIndicator(lives, x = 20, y = 60) {
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('LIVES', x, y - 4);
    for (let i = 0; i < CONFIG.player.lives; i++) {
      this.ctx.beginPath();
      this.ctx.arc(x + 8 + i * 20, y + 8, 7, 0, Math.PI * 2);
      this.ctx.fillStyle = i < lives ? '#FF4466' : '#444';
      this.ctx.fill();
    }
  }

  drawScoreIndicator(score, x = 780, y = 30) {
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Score: ${score}`, x, y);
    this.ctx.textAlign = 'left';
  }

  drawWaveIndicator(wave, x = 780, y = 55) {
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Wave: ${wave}`, x, y);
    this.ctx.textAlign = 'left';
  }

  // Full 8-slot bullet bar along the top (centred, below the HP/score rows)
  drawBulletHUD(currentBullet, unlockedBullets, bulletImages) {
    const slot = 32, gap = 4, total = 8;
    const barW = total * (slot + gap) - gap;
    let bx     = (this.ctx.canvas.width - barW) / 2;
    const by   = 8;

    for (let t = 1; t <= total; t++) {
      const unlocked = unlockedBullets.has(t);
      const active   = t === currentBullet;

      this.ctx.save();
      this.ctx.globalAlpha = unlocked ? 1.0 : 0.25;

      this.ctx.fillStyle = '#222';
      this.ctx.fillRect(bx, by, slot, slot);

      if (active && unlocked) {
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur  = 12;
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth   = 2;
        this.ctx.strokeRect(bx - 1, by - 1, slot + 2, slot + 2);
      }

      if (bulletImages[t]) this.ctx.drawImage(bulletImages[t], bx, by, slot, slot);

      if (!unlocked) {
        this.ctx.globalAlpha = 0.65;
        this.ctx.fillStyle   = '#000';
        this.ctx.fillRect(bx, by, slot, slot);
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle   = '#aaa';
        this.ctx.font        = 'bold 16px Arial';
        this.ctx.textAlign   = 'center';
        this.ctx.fillText('?', bx + slot / 2, by + slot / 2 + 6);
        this.ctx.textAlign   = 'left';
      }

      this.ctx.globalAlpha = unlocked ? 0.6 : 0.2;
      this.ctx.fillStyle   = '#fff';
      this.ctx.font        = '9px Arial';
      this.ctx.fillText(t, bx + 2, by + 10);

      this.ctx.restore();
      bx += slot + gap;
    }
  }

  // ===== Menu screen =====

  drawMenu(cursor = 0) {
    const cw = this.ctx.canvas.width, ch = this.ctx.canvas.height;

    this.ctx.fillStyle = 'rgba(0,0,0,0.72)';
    this.ctx.fillRect(0, 0, cw, ch);

    // Art placeholder box
    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx.lineWidth   = 1;
    this.ctx.strokeRect(60, 30, cw - 120, 260);
    this.ctx.fillStyle = 'rgba(255,255,255,0.04)';
    this.ctx.fillRect(60, 30, cw - 120, 260);
    this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
    this.ctx.font = 'italic 15px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('[ Art coming soon ]', cw / 2, 165);

    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 52px Arial';
    this.ctx.fillText('SHOOTER', cw / 2, 340);

    // Selectable options
    const options = ['Play', 'Tutorial'];
    options.forEach((label, i) => {
      const oy = 400 + i * 50;
      const selected = cursor === i;

      if (selected) {
        this.ctx.fillStyle = 'rgba(255,215,0,0.15)';
        this.ctx.fillRect(cw / 2 - 130, oy - 28, 260, 38);
      }

      this.ctx.fillStyle  = selected ? '#FFD700' : '#AAA';
      this.ctx.font       = selected ? 'bold 26px Arial' : '24px Arial';
      this.ctx.fillText((selected ? '> ' : '  ') + label, cw / 2, oy);
    });

    // Nav hint
    this.ctx.fillStyle = '#555';
    this.ctx.font = '13px Arial';
    this.ctx.fillText('Up / Down to navigate    Enter to select', cw / 2, ch - 18);
    this.ctx.textAlign = 'left';
  }

  // ===== Tutorial screen =====

  drawTutorial(bulletImages) {
    const cw = this.ctx.canvas.width, ch = this.ctx.canvas.height;
    this.ctx.fillStyle = 'rgba(0,0,0,0.88)';
    this.ctx.fillRect(0, 0, cw, ch);

    const header = (txt, y) => {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font      = 'bold 17px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(txt, 50, y);
    };

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HOW TO PLAY', cw / 2, 42);
    this.ctx.textAlign = 'left';

    let y = 75;

    header('CONTROLS', y); y += 22;
    const rows = [
      ['Move',          'Arrow Keys  /  WASD'],
      ['Jump',          'Space  /  W  /  Up'],
      ['Drop through',  'Down  /  S  (on a platform)'],
      ['Shoot',         'X  /  Enter'],
      ['Cycle Bullet',  'C   or   1-8 keys'],
      ['Pause',         'P  /  Esc'],
    ];
    for (const [label, value] of rows) {
      this.ctx.fillStyle = '#AAA'; this.ctx.font = '14px Arial';
      this.ctx.fillText(label, 65, y);
      this.ctx.fillStyle = '#FFF';
      this.ctx.fillText(value, 240, y);
      y += 20;
    }
    y += 8;

    header('BULLET AFFINITIES', y); y += 22;
    const pairs = [
      ['Love     (1) ->  Hate',         'Code      (5) ->  Ignorance'],
      ['Music    (2) ->  Void',         'Dance     (6) ->  Lethargy'],
      ['Story    (3) ->  Thoughtless',  'Faith     (7) ->  Catholic Devil'],
      ['Art      (4) ->  Blue',         'Stellar   (8) ->  Impostor (boss)'],
    ];
    for (const [left, right] of pairs) {
      this.ctx.fillStyle = '#CCC'; this.ctx.font = '14px Arial';
      this.ctx.fillText(left, 65, y);
      this.ctx.fillText(right, 420, y);
      y += 20;
    }

    const slot = 28;
    let bx = 65;
    for (let t = 1; t <= 8; t++) {
      if (bulletImages?.[t]) this.ctx.drawImage(bulletImages[t], bx, y, slot, slot);
      bx += slot + 4;
    }
    y += slot + 12;

    header('UNLOCKING BULLETS', y); y += 22;
    this.ctx.fillStyle = '#CCC'; this.ctx.font = '14px Arial';
    this.ctx.fillText('Kill Enemy N to drop Bullet N+1 (the tool for the next threat).', 65, y); y += 19;
    this.ctx.fillText('Walk over the glowing bullet to unlock it!', 65, y); y += 28;

    header('SURVIVAL', y); y += 22;
    this.ctx.fillStyle = '#CCC'; this.ctx.font = '14px Arial';
    this.ctx.fillText('Enemies get faster each wave.  You have 3 lives.', 65, y); y += 19;
    this.ctx.fillText('Green crosses heal 25 HP.  Use the right bullet!', 65, y);

    this.ctx.fillStyle = '#666';
    this.ctx.font = '15px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Press  ENTER  or  ESC  to return', cw / 2, ch - 16);
    this.ctx.textAlign = 'left';
  }

  // ===== Pause overlay =====

  drawPaused() {
    const cw = this.ctx.canvas.width, ch = this.ctx.canvas.height;

    this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.ctx.fillRect(0, 0, cw, ch);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 56px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', cw / 2, ch / 2 - 10);

    this.ctx.fillStyle = '#AAA';
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Press  P  or  ESC  to resume', cw / 2, ch / 2 + 35);
    this.ctx.textAlign = 'left';
  }

  // ===== Game Over screen =====

  drawGameOver(score, cursor = 0) {
    const cw = this.ctx.canvas.width, ch = this.ctx.canvas.height;

    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(0, 0, cw, ch);

    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', cw / 2, ch / 2 - 50);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`Final Score: ${score}`, cw / 2, ch / 2 + 5);

    // Selectable options
    const options = ['Play Again', 'Main Menu'];
    options.forEach((label, i) => {
      const oy = ch / 2 + 55 + i * 42;
      const selected = cursor === i;

      if (selected) {
        this.ctx.fillStyle = 'rgba(255,215,0,0.15)';
        this.ctx.fillRect(cw / 2 - 120, oy - 26, 240, 34);
      }

      this.ctx.fillStyle = selected ? '#FFD700' : '#AAA';
      this.ctx.font      = selected ? 'bold 22px Arial' : '20px Arial';
      this.ctx.fillText((selected ? '> ' : '  ') + label, cw / 2, oy);
    });

    this.ctx.fillStyle = '#555';
    this.ctx.font = '13px Arial';
    this.ctx.fillText('Up / Down to navigate    Enter to select', cw / 2, ch - 18);
    this.ctx.textAlign = 'left';
  }
}
