// ======= PHYSICS ENGINE =======

class PhysicsEngine {
  constructor(platforms, groundY, canvasWidth, canvasHeight) {
    this.platforms = platforms;
    this.groundY = groundY;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Apply gravity to an entity (uses deltaTime)
   */
  applyGravity(entity, gravity, deltaTime) {
    entity.velY += gravity * deltaTime;
    entity.y += entity.velY * deltaTime;
  }

  /**
   * Check if entity is grounded or on platform
   */
  isGrounded(entity) {
    if (entity.y >= this.groundY && entity.velY >= 0) return true;

    const platY = isOnPlatform(
      entity.x,
      entity.y,
      entity.width,
      entity.height,
      this.platforms
    );

    return platY !== null && entity.velY >= 0;
  }

  /**
   * Resolve platform collision for an entity
   */
  resolvePlatformCollision(entity) {
    const platY = isOnPlatform(
      entity.x,
      entity.y,
      entity.width,
      entity.height,
      this.platforms
    );

    if (platY !== null && entity.velY >= 0) {
      entity.y = platY;
      entity.velY = 0;
      return true;
    }
    return false;
  }

  /**
   * Clamp entity to ground
   */
  clampToGround(entity) {
    // For entities taller than 50px, adjust ground position
    let effectiveGroundY = this.groundY;
    if (entity.height > 50) {
      effectiveGroundY = Math.min(this.groundY, this.canvasHeight - entity.height);
    }

    if (entity.y >= effectiveGroundY) {
      entity.y = effectiveGroundY;
      entity.velY = 0;
      return true;
    }
    return false;
  }

  /**
   * Apply full physics update to entity
   */
  updateEntity(entity, gravity, deltaTime) {
    this.applyGravity(entity, gravity, deltaTime);

    // Check platform collision first
    if (!this.resolvePlatformCollision(entity)) {
      // If not on platform, check ground
      this.clampToGround(entity);
    }
  }

  /**
   * Keep entity within canvas bounds horizontally
   */
  clampHorizontal(entity) {
    entity.x = clamp(entity.x, 0, this.canvasWidth - entity.width);
  }
}
