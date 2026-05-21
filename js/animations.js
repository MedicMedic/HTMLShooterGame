// ======= ANIMATION SYSTEM =======

class Animation {
  constructor(frames, interval, mode = 'step') {
    this.frames = frames;  // Array of Image objects
    this.interval = interval;  // milliseconds per frame
    this.mode = mode;  // 'step' or 'fade'

    this.currentFrame = 0;
    this.nextFrame = frames.length > 1 ? 1 : 0;
    this.frameTimer = 0;  // milliseconds
    this.blendProgress = 0;  // 0-1 for fade mode
  }

  /**
   * Update animation based on deltaTime
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {boolean} shouldAnimate - Whether to advance the animation
   */
  update(deltaTime, shouldAnimate = true) {
    if (!shouldAnimate || this.frames.length <= 1) return;

    // Convert deltaTime to milliseconds
    this.frameTimer += deltaTime * 1000;

    if (this.mode === 'fade') {
      if (this.frameTimer >= this.interval) {
        this.frameTimer = 0;
        this.currentFrame = this.nextFrame;
        this.nextFrame = (this.nextFrame + 1) % this.frames.length;
        this.blendProgress = 0;
      } else {
        this.blendProgress = this.frameTimer / this.interval;
      }
    } else if (this.mode === 'step') {
      if (this.frameTimer >= this.interval) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      }
    }
  }

  /**
   * Draw the current animation frame
   */
  draw(ctx, x, y, width, height, flipH = false) {
    if (this.frames.length === 0) return;

    ctx.save();
    ctx.translate(x, y);

    if (flipH) {
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);
    }

    if (this.mode === 'fade' && this.frames.length > 1) {
      const imgA = this.frames[this.currentFrame];
      const imgB = this.frames[this.nextFrame];

      if (imgA instanceof HTMLImageElement && imgB instanceof HTMLImageElement) {
        // Draw current frame fading out
        ctx.globalAlpha = 1 - this.blendProgress;
        ctx.drawImage(imgA, 0, 0, width, height);

        // Draw next frame fading in
        ctx.globalAlpha = this.blendProgress;
        ctx.drawImage(imgB, 0, 0, width, height);

        ctx.globalAlpha = 1.0;
      }
    } else {
      // Step mode or static
      const img = this.frames[this.currentFrame];
      if (img instanceof HTMLImageElement) {
        ctx.drawImage(img, 0, 0, width, height);
      }
    }

    ctx.restore();
  }

  /**
   * Reset animation to first frame
   */
  reset() {
    this.currentFrame = 0;
    this.nextFrame = this.frames.length > 1 ? 1 : 0;
    this.frameTimer = 0;
    this.blendProgress = 0;
  }

  /**
   * Get current frame image (for compatibility)
   */
  getCurrentFrame() {
    return this.frames[this.currentFrame];
  }
}

class AnimationController {
  constructor() {
    this.animations = new Map();  // name -> Animation
    this.currentAnimation = null;
    this.currentName = null;
  }

  /**
   * Add an animation to the controller
   */
  addAnimation(name, frames, interval, mode = 'step') {
    this.animations.set(name, new Animation(frames, interval, mode));
  }

  /**
   * Set the active animation
   */
  setAnimation(name) {
    if (this.currentName === name) return;

    const anim = this.animations.get(name);
    if (anim) {
      this.currentAnimation = anim;
      this.currentName = name;
      anim.reset();
    }
  }

  /**
   * Update current animation
   */
  update(deltaTime, shouldAnimate = true) {
    if (this.currentAnimation) {
      this.currentAnimation.update(deltaTime, shouldAnimate);
    }
  }

  /**
   * Draw current animation
   */
  draw(ctx, x, y, width, height, flipH = false) {
    if (this.currentAnimation) {
      this.currentAnimation.draw(ctx, x, y, width, height, flipH);
    }
  }

  /**
   * Get current frame (for compatibility)
   */
  getCurrentFrame() {
    return this.currentAnimation ? this.currentAnimation.getCurrentFrame() : null;
  }
}
