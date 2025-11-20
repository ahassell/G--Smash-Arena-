
import { Hitbox, PlayerCharacter } from "./types";

export const FPS = 60;
export const GRAVITY = 0.35;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;
export const MOVE_SPEED = 0.6;
export const MAX_SPEED = 6;
export const FALL_SPEED = 9; // Terminal velocity for normal fall
export const JUMP_FORCE = -9.5;
export const DOUBLE_JUMP_FORCE = -8.5;
export const FAST_FALL_SPEED = 12;
export const LEDGE_SNAP_DIST = 60;
export const GROUND_Y = 650;

export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;
export const BLAST_ZONE_PADDING = 450;

export const CHARACTERS: Record<PlayerCharacter, {
  name: string;
  color: string;
  speed: number;
  weight: number;
  standard: {
    neutral: Hitbox;
    side: Hitbox;
    up: Hitbox;
    down: Hitbox;
  };
  special: {
    neutral: Hitbox;
    side: Hitbox;
    up: Hitbox; // Recovery
    down: Hitbox;
  }
}> = {
  [PlayerCharacter.CYBER_NINJA]: {
    name: "Neon Blade",
    color: "#3b82f6",
    speed: 1.3, // Fast
    weight: 0.9, // Light
    standard: {
      neutral: {
        xOffset: 20, yOffset: 10, width: 50, height: 20,
        damage: 3, knockbackBase: 2, knockbackScaling: 0.2, angle: -Math.PI / 6,
        startupFrames: 3, activeFrames: 4
      },
      side: {
        xOffset: 30, yOffset: 10, width: 60, height: 30,
        damage: 8, knockbackBase: 6, knockbackScaling: 0.8, angle: -Math.PI / 4,
        startupFrames: 6, activeFrames: 6
      },
      up: {
        xOffset: 0, yOffset: -40, width: 40, height: 50,
        damage: 6, knockbackBase: 7, knockbackScaling: 0.9, angle: -Math.PI / 2,
        startupFrames: 5, activeFrames: 6
      },
      down: {
        xOffset: 10, yOffset: 40, width: 50, height: 30,
        damage: 7, knockbackBase: 5, knockbackScaling: 0.6, angle: Math.PI / 4,
        startupFrames: 5, activeFrames: 5
      },
    },
    special: {
      neutral: { // Thousand Cuts
        xOffset: 40, yOffset: 0, width: 70, height: 60,
        damage: 14, knockbackBase: 8, knockbackScaling: 1.1, angle: -Math.PI / 4,
        startupFrames: 12, activeFrames: 20,
        selfVelocity: { x: 0, y: 0 }
      },
      side: { // Phantom Dash
        xOffset: 0, yOffset: 10, width: 80, height: 30,
        damage: 10, knockbackBase: 9, knockbackScaling: 1.0, angle: -Math.PI / 3,
        startupFrames: 10, activeFrames: 10,
        selfVelocity: { x: 18, y: 0 } // Fast lung
      },
      up: { // Rising Slash (Recovery)
        xOffset: 0, yOffset: -30, width: 50, height: 70,
        damage: 9, knockbackBase: 8, knockbackScaling: 0.8, angle: -Math.PI / 2,
        startupFrames: 5, activeFrames: 20,
        selfVelocity: { x: 0, y: -16 } // High jump
      },
      down: { // Dive Kick
        xOffset: 10, yOffset: 20, width: 40, height: 50,
        damage: 12, knockbackBase: 7, knockbackScaling: 1.0, angle: Math.PI / 4,
        startupFrames: 15, activeFrames: 30,
        selfVelocity: { x: 8, y: 15 } // Diagonal down
      }
    }
  },
  [PlayerCharacter.MECHA_BRUISER]: {
    name: "Iron Titan",
    color: "#ef4444",
    speed: 0.8, // Slow
    weight: 1.4, // Heavy
    standard: {
      neutral: {
        xOffset: 30, yOffset: 0, width: 60, height: 40,
        damage: 9, knockbackBase: 6, knockbackScaling: 0.8, angle: -Math.PI / 6,
        startupFrames: 8, activeFrames: 8
      },
      side: {
        xOffset: 40, yOffset: 0, width: 80, height: 50,
        damage: 12, knockbackBase: 8, knockbackScaling: 1.1, angle: -Math.PI / 8,
        startupFrames: 12, activeFrames: 10
      },
      up: {
        xOffset: -10, yOffset: -50, width: 80, height: 40,
        damage: 10, knockbackBase: 9, knockbackScaling: 1.0, angle: -Math.PI / 2,
        startupFrames: 10, activeFrames: 8
      },
      down: {
        xOffset: -20, yOffset: 40, width: 100, height: 30,
        damage: 10, knockbackBase: 8, knockbackScaling: 0.9, angle: Math.PI / 2,
        startupFrames: 10, activeFrames: 8
      },
    },
    special: {
      neutral: { // Charge Cannon
        xOffset: 40, yOffset: -10, width: 200, height: 40, // Long range
        damage: 20, knockbackBase: 12, knockbackScaling: 1.3, angle: 0,
        startupFrames: 35, activeFrames: 5,
        selfVelocity: { x: -2, y: 0 } // Recoil
      },
      side: { // Rocket Tackle
        xOffset: 20, yOffset: 10, width: 70, height: 60,
        damage: 16, knockbackBase: 10, knockbackScaling: 1.2, angle: -Math.PI / 4,
        startupFrames: 20, activeFrames: 15,
        selfVelocity: { x: 12, y: -3 }
      },
      up: { // Jetpack (Recovery)
        xOffset: -20, yOffset: -20, width: 100, height: 60,
        damage: 8, knockbackBase: 7, knockbackScaling: 0.8, angle: -Math.PI / 2,
        startupFrames: 8, activeFrames: 40,
        selfVelocity: { x: 0, y: -13 } // Sustained lift
      },
      down: { // Piston Slam
        xOffset: -30, yOffset: 20, width: 120, height: 40,
        damage: 18, knockbackBase: 10, knockbackScaling: 1.2, angle: -Math.PI / 2, 
        startupFrames: 15, activeFrames: 10,
        selfVelocity: { x: 0, y: 20 }, // Fast fall
        hitstun: 45 // High hitstun for a heavy slam
      }
    }
  }
};

export const PLATFORMS = [
  { x: 240, y: 550, w: 800, h: 20, isHardFloor: true }, // Main stage
  { x: 340, y: 400, w: 120, h: 15, isHardFloor: false },
  { x: 820, y: 400, w: 120, h: 15, isHardFloor: false },
  { x: 580, y: 250, w: 120, h: 15, isHardFloor: false },
];
