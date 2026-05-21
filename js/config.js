// ======= GAME CONFIGURATION =======
const CONFIG = {
  player: {
    width: 50,
    height: 50,
    speed: 300,  // pixels per second (was 5 per frame)
    jumpStrength: -900,  // pixels per second (increased for platform jumping)
    gravity: 1800,  // pixels per second squared (was 0.3 per frame)
    groundY: 550,
    flicker: { holdMs: 5000, durationMs: 2000, slowFactor: 0.5 },
    maxHP: 100,
    lives: 3,
    respawnInvulnMs: 1500,
  },
  combat: {
    touchDamage: 10,
    touchDamageCooldown: 500
  },
  bullets: {
    1: { width: 20, height: 20, speed: 360, src: 'assets/bullets/bullet1.png' },  // was 6
    2: { width: 20, height: 20, speed: 360, src: 'assets/bullets/bullet2.png' },
    3: { width: 20, height: 20, speed: 420, src: 'assets/bullets/bullet3.png' },  // was 7
    4: { width: 20, height: 20, speed: 420, src: 'assets/bullets/bullet4.png' },
    5: { width: 20, height: 20, speed: 480, src: 'assets/bullets/bullet5.png' },  // was 8
    6: { width: 20, height: 20, speed: 540, src: 'assets/bullets/bullet6.png' },  // was 9
    7: { width: 20, height: 20, speed: 600, src: 'assets/bullets/bullet7.png' },  // was 10
    8: { width: 20, height: 20, speed: 720, src: 'assets/bullets/bullet8.png' },  // was 12
  },
  bulletTypes: [1, 2, 3, 4, 5, 6, 7, 8],
  enemies: {
    // Drop chain: killing Enemy N unlocks Bullet N+1 (the tool to fight the next threat)
    // Bullet names: 1=Love  2=Music  3=Story  4=Art  5=Code  6=Dance  7=Faith  8=Stellar
    1: { // Hate (Green) — raw aggression, fast, low HP  |  drops: Music
      width: 50, height: 50, baseSpeed: 72, baseHealth: 10,
      frames: ['assets/enemies/enemy1_1.png', 'assets/enemies/enemy1_2.png'],
      jumpFrame: 'assets/enemies/enemy1_jump.png',
      animMode: 'step', jumpStrength: -720, animationInterval: 300,
      dropsBullet: 2,
    },
    2: { // Void (Orange) — ethereal, fading, medium HP  |  drops: Story
      width: 50, height: 50, baseSpeed: 60, baseHealth: 15,
      frames: ['assets/enemies/enemy2_1.png', 'assets/enemies/enemy2_2.png'],
      animMode: 'fade', animationInterval: 500, jumpStrength: -720,
      dropsBullet: 3,
    },
    3: { // Thoughtless (Purple) — mindless charge, no planning  |  drops: Art
      width: 50, height: 50, baseSpeed: 60, baseHealth: 20,
      frames: ['assets/enemies/enemy3_1.png', 'assets/enemies/enemy3_2.png'],
      animMode: 'step', jumpStrength: -720, animationInterval: 300,
      dropsBullet: 4,
    },
    4: { // Blue (unnamed) — fast but erratic  |  drops: Code
      width: 50, height: 50, baseSpeed: 90, baseHealth: 20,
      frames: ['assets/enemies/enemy4_1.png', 'assets/enemies/enemy4_2.png'],
      jumpFrame: 'assets/enemies/enemy4_jump.png',
      animMode: 'step', jumpStrength: -720, animationInterval: 300,
      dropsBullet: 5,
    },
    5: { // Ignorance (Red) — willfully evasive, high jumper  |  drops: Dance
      width: 50, height: 50, baseSpeed: 90, baseHealth: 20,
      frames: ['assets/enemies/enemy5_1.png', 'assets/enemies/enemy5_2.png'],
      animMode: 'step', jumpStrength: -900, animationInterval: 300,
      dropsBullet: 6,
    },
    6: { // Lethargy (Yellow) — extremely slow but absorbs punishment  |  drops: Faith
      width: 50, height: 50, baseSpeed: 6, baseHealth: 25,
      frames: ['assets/enemies/enemy6_1.png', 'assets/enemies/enemy6_2.png'],
      animMode: 'step', jumpStrength: 0, animationInterval: 300,
      dropsBullet: 7,
    },
    7: { // Catholic Devil (big hat fish) — extremely fast and aggressive, high jumper  |  drops: Stellar
      width: 50, height: 50, baseSpeed: 300, baseHealth: 20,
      frames: ['assets/enemies/enemy7_1.png', 'assets/enemies/enemy7_2.png'],
      jumpFrame: 'assets/enemies/enemy7_jump.png',
      animMode: 'step', jumpStrength: -1200, animationInterval: 200,
      dropsBullet: 8,
    },
    8: { // Impostor Syndrome (BIG MONSTER) — boss, huge, pretends to be invincible
      // First appearance: only 1 spawns, always drops health
      width: 100, height: 100, baseSpeed: 30, baseHealth: 250,
      frames: ['assets/enemies/enemy8_1.png', 'assets/enemies/enemy8_2.png'],
      animMode: 'step', jumpStrength: 0, animationInterval: 400,
      dropsBullet: null,  // boss drops health only (see _onEnemyKilled)
    },
  },
  sprites: {
    player: 'assets/player/player_idle.png',
    playerWalk: [
      'assets/player/player_walking_1.png',
      'assets/player/player_idle.png',
      'assets/player/player_walking_2.png',
      'assets/player/player_idle.png',
    ],
    playerJump: 'assets/player/player_jump.png',
    playerThrow: 'assets/player/player_throw.png',
    platform: 'assets/environment/platform.png'
  },
  waves: {
    startEnemies: 3,
    coolDownMs: 2000,
    speedIncreasePerWave: 12,  // was 0.2 per frame
  },
  platforms: [
    { x: 75, y: 454, width: 300, height: 30 },
    { x: 460, y: 421, width: 300, height: 30 },
    { x: 465, y: 306, width: 300, height: 30 },
    { x: 53, y: 277, width: 300, height: 30 },
    { x: 320, y: 162, width: 300, height: 30 },
  ],
  particles: {
    shootCount: 3,
    hitCount: 8,
    gravity: 300,
    lifetime: 500,
    trailCount: 2,
    trailInterval: 50,
  },
  // ---- ASSET SLOTS ----
  // Set any null to a file path string to enable it.
  assets: {
    healthPickup:   null, // 'assets/items/health.png'    — replaces procedural green cross
    menuBackground: null, // 'assets/ui/menu_bg.png'      — fullscreen art behind menu
    lifeIcon:       null, // 'assets/ui/life.png'         — replaces coloured circle
    bulletSlotBg:   null, // 'assets/ui/bullet_slot.png'  — frame behind each bullet slot
    // One entry per wave (wraps if waves exceed array length):
    backgrounds: ['assets/environment/background1.png'],
  },
  // ---- LIMITS ----
  limits: {
    maxBulletsOnScreen: 15,  // prevents bullet-spam slowdown
    maxDamageNumbers:   20,  // keeps floating text manageable
  },
};

// ======= DAMAGE MATRIX =======
// Rows = Bullet type (1-8), Columns = Enemy type (1-8)
//
// Bullets:  1=Love(Red)  2=Music(Blue)  3=Story(Yellow)  4=Art(Orange)
//           5=Code(Green) 6=Dance(Purple) 7=Faith(GWR) 8=Stellar(Cutie Mark)
//
// Enemies:  1=Hate(Green)  2=Void(Orange)  3=Thoughtless(Purple)  4=Blue
//           5=Ignorance(Red)  6=Lethargy(Yellow)  7=CatholicDevil  8=ImpostorSyndrome(boss)
//
// Rules:
//  • Bullet N one-shots Enemy N (20 dmg) — same-number matchups are the intended counter.
//  • Cross-type interactions are based on thematic logic (see comments per row).
//  • Bullet 8 (Stellar) is MID vs all non-boss (10) but DEVASTATING vs the boss (28).
//    It's the only bullet that truly sees through the Impostor.
//  • Boss resists early bullets (4-6 dmg) and is only meaningfully threatened by B6-B8.
//
//                       E1    E2    E3    E4    E5    E6    E7    E8(boss)
//                     Hate  Void  Thls  Blue  Ignr  Leth  CDvl  Imps
const DAMAGE_MATRIX = {
  // B1 Love (Red) — Love directly destroys Hate. Struggles against abstract/systemic enemies.
  //    Love can motivate the lethargic and reach the sad (Blue), but can't fix ignorance alone.
  1: { 1: 20, 2:  5, 3:  6, 4:  7, 5:  5, 6:  7, 7:  5, 8:  4 },

  // B2 Music (Blue) — Music fills the Void. Soothes Hate and energises the Lethargic.
  //    Church music is complicated (5 vs CatholicDevil). Doesn't cure ignorance.
  2: { 1:  8, 2: 20, 3:  8, 4:  7, 5:  6, 6:  8, 7:  5, 8:  5 },

  // B3 Story (Yellow) — Narrative defeats Thoughtlessness. Stories educate (good vs Ignorance).
  //    Stories fill Void with meaning and give the CatholicDevil context. Weak vs pure hate.
  3: { 1:  6, 2:  8, 3: 20, 4:  8, 5:  9, 6:  6, 7:  7, 8:  5 },

  // B4 Art (Orange) — Art is pure expression, strong vs the unnamed Blue.
  //    Opens minds (decent vs Ignorance), fills Void, but art alone won't stop a Devil.
  4: { 1:  6, 2:  8, 3:  8, 4: 20, 5:  8, 6:  6, 7:  6, 8:  6 },

  // B5 Code (Green) — Logic and knowledge obliterate Ignorance.
  //    Decent vs most thinking enemies. Faith vs logic = weak (5 vs Devil). Systematic = boss ok.
  5: { 1:  6, 2:  6, 3:  8, 4:  6, 5: 20, 6:  8, 7:  5, 8:  8 },

  // B6 Dance (Purple) — Movement is the cure for Lethargy. Joy fights Hate and Void.
  //    Many religions restrict dance (weak vs CatholicDevil). Dance is authentic = ok vs boss.
  6: { 1:  7, 2:  8, 3:  6, 4:  8, 5:  8, 6: 20, 7:  5, 8:  8 },

  // B7 Faith (Green/White/Red) — True faith confronts the CatholicDevil directly.
  //    Faith fills existential Void (9), inspires against Lethargy (8). Thoughtless faith = weak (5).
  7: { 1:  6, 2:  9, 3:  5, 4:  8, 5:  6, 6:  8, 7: 20, 8:  9 },

  // B8 Stellar (Cutie Mark) — Cosmic identity, mid vs all (10), devastating vs Impostor (28).
  //    The truest self cannot be imitated. The only bullet that fully exposes the Impostor.
  8: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 28 },
};
