
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum PlayerCharacter {
  CYBER_NINJA = 'CYBER_NINJA',
  MECHA_BRUISER = 'MECHA_BRUISER',
}

export enum ActionState {
  IDLE,
  RUN,
  JUMP,
  FALL,
  ATTACK_NEUTRAL,
  ATTACK_SIDE,
  ATTACK_UP,
  ATTACK_DOWN,
  SPECIAL_NEUTRAL,
  SPECIAL_SIDE,
  SPECIAL_UP,
  SPECIAL_DOWN,
  SPECIAL_FALL, // Helpless state after recovery
  LEDGE_GRAB,
  STUN,
  DEAD
}

export interface Vector {
  x: number;
  y: number;
}

export interface Hitbox {
  xOffset: number;
  yOffset: number;
  width: number;
  height: number;
  damage: number;
  knockbackBase: number;
  knockbackScaling: number;
  angle: number; // radians
  activeFrames: number;
  startupFrames: number;
  selfVelocity?: Vector; // Velocity applied to the attacker (e.g., lunges)
  hitstun?: number; // Optional fixed hitstun override
}

export interface PlayerObj {
  id: number;
  pos: Vector;
  vel: Vector;
  size: Vector;
  color: string;
  character: PlayerCharacter;
  percentage: number;
  stocks: number;
  state: ActionState;
  facingRight: boolean;
  jumpsRemaining: number;
  isGrounded: boolean;
  attackCooldown: number;
  stunFrames: number;
  currentAttack: Hitbox | null;
  attackFrame: number;
  hitTargets: number[]; // List of player IDs hit by current attack
  shielding: boolean;
  hasUsedRecovery: boolean;
  ledgeCooldown: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  isHardFloor?: boolean;
}

export interface Particle {
  id: string;
  pos: Vector;
  vel: Vector;
  life: number;
  color: string;
  size: number;
}

export interface GameLog {
  timestamp: number;
  message: string;
}

export interface PhysicsConfig {
  gravity: number;
  moveSpeed: number; // acceleration
  maxSpeed: number;
  fallSpeed: number; // Terminal velocity
  jumpForce: number;
  doubleJumpForce: number;
  friction: number;
  airResistance: number;
  knockbackNormalScale: number;
  knockbackSpecialScale: number;
  hitstunScale: number;
}
