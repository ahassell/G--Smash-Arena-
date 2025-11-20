
import React, { useEffect, useRef, useState } from 'react';
import { 
  FPS, GRAVITY, FRICTION, AIR_RESISTANCE, MOVE_SPEED, MAX_SPEED, FALL_SPEED, JUMP_FORCE, 
  DOUBLE_JUMP_FORCE, FAST_FALL_SPEED, CHARACTERS, PLATFORMS, BLAST_ZONE_PADDING, STAGE_WIDTH, STAGE_HEIGHT 
} from '../constants';
import { 
  PlayerObj, ActionState, Vector, PlayerCharacter, Particle, Hitbox, PhysicsConfig 
} from '../types';
import { generateMatchCommentary } from '../services/gemini';
import { Settings, X, RotateCcw } from 'lucide-react';

interface GameProps {
  onGameOver: (winner: number) => void;
}

const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: GRAVITY,
  moveSpeed: MOVE_SPEED,
  maxSpeed: MAX_SPEED,
  fallSpeed: FALL_SPEED,
  jumpForce: JUMP_FORCE,
  doubleJumpForce: DOUBLE_JUMP_FORCE,
  friction: FRICTION,
  airResistance: AIR_RESISTANCE,
  knockbackNormalScale: 1.0,
  knockbackSpecialScale: 1.0,
  hitstunScale: 1.0
};

export const Game: React.FC<GameProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Tuning State
  const [tuningPlayer, setTuningPlayer] = useState<number | null>(null); // 1 or 2, null if closed
  const [p1Config, setP1Config] = useState<PhysicsConfig>({ ...DEFAULT_PHYSICS });
  const [p2Config, setP2Config] = useState<PhysicsConfig>({ ...DEFAULT_PHYSICS });
  
  // Refs for physics loop
  const p1ConfigRef = useRef<PhysicsConfig>(p1Config);
  const p2ConfigRef = useRef<PhysicsConfig>(p2Config);

  useEffect(() => { p1ConfigRef.current = p1Config; }, [p1Config]);
  useEffect(() => { p2ConfigRef.current = p2Config; }, [p2Config]);

  const playersRef = useRef<PlayerObj[]>([
    {
      id: 1,
      pos: { x: 400, y: 300 },
      vel: { x: 0, y: 0 },
      size: { x: 40, y: 70 },
      color: CHARACTERS[PlayerCharacter.CYBER_NINJA].color,
      character: PlayerCharacter.CYBER_NINJA,
      percentage: 0,
      stocks: 3,
      state: ActionState.FALL,
      facingRight: true,
      jumpsRemaining: 2,
      isGrounded: false,
      attackCooldown: 0,
      stunFrames: 0,
      currentAttack: null,
      attackFrame: 0,
      hitTargets: [],
      shielding: false,
      hasUsedRecovery: false,
      ledgeCooldown: 0
    },
    {
      id: 2,
      pos: { x: 800, y: 300 },
      vel: { x: 0, y: 0 },
      size: { x: 60, y: 70 },
      color: CHARACTERS[PlayerCharacter.MECHA_BRUISER].color,
      character: PlayerCharacter.MECHA_BRUISER,
      percentage: 0,
      stocks: 3,
      state: ActionState.FALL,
      facingRight: false,
      jumpsRemaining: 2,
      isGrounded: false,
      attackCooldown: 0,
      stunFrames: 0,
      currentAttack: null,
      attackFrame: 0,
      hitTargets: [],
      shielding: false,
      hasUsedRecovery: false,
      ledgeCooldown: 0
    }
  ]);
  
  const particlesRef = useRef<Particle[]>([]);
  const keysPressed = useRef<Record<string, boolean>>({});
  const logsRef = useRef<string[]>([]);
  const lastCommentaryTime = useRef<number>(0);
  const [commentary, setCommentary] = useState<string>("FIGHT!");

  const [uiState, setUiState] = useState({
    p1Percent: 0,
    p2Percent: 0,
    p1Stocks: 3,
    p2Stocks: 3
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const spawnParticle = (pos: Vector, color: string, count = 5, speed = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        vel: { x: (Math.random() - 0.5) * speed, y: (Math.random() - 0.5) * speed },
        life: 20 + Math.random() * 20,
        color: color,
        size: 3 + Math.random() * 5
      });
    }
  };

  const addLog = (msg: string) => {
    logsRef.current.push(msg);
    const now = Date.now();
    if (now - lastCommentaryTime.current > 4000) {
      triggerCommentary();
      lastCommentaryTime.current = now;
    }
  };

  const triggerCommentary = async () => {
    if (logsRef.current.length === 0) return;
    const text = await generateMatchCommentary(logsRef.current);
    setCommentary(text);
    logsRef.current = []; 
  };

  const resetPlayer = (p: PlayerObj) => {
    p.pos = { x: STAGE_WIDTH / 2 + (p.id === 1 ? -100 : 100), y: 200 };
    p.vel = { x: 0, y: 0 };
    p.percentage = 0;
    p.state = ActionState.FALL;
    p.stunFrames = 0;
    p.jumpsRemaining = 2;
    p.hasUsedRecovery = false;
    p.ledgeCooldown = 0;
    p.hitTargets = [];
    spawnParticle(p.pos, '#ffffff', 20);
    addLog(`Player ${p.id} respawned!`);
  };

  const resetTuning = (playerId: number) => {
    if (playerId === 1) setP1Config({ ...DEFAULT_PHYSICS });
    else setP2Config({ ...DEFAULT_PHYSICS });
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, p: PlayerObj) => {
    ctx.save();
    // Translate to center of player for rotation/flipping
    ctx.translate(p.pos.x + p.size.x / 2, p.pos.y + p.size.y / 2);
    if (!p.facingRight) ctx.scale(-1, 1);

    // Shake if stunned
    if (p.state === ActionState.STUN) {
        ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
    }

    if (p.character === PlayerCharacter.CYBER_NINJA) {
        // --- NINJA VISUALS ---
        // Body
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size.x/2, -p.size.y/2 + 10, p.size.x, p.size.y - 10);
        
        // Head
        ctx.fillStyle = "#1e293b"; // Dark hood
        ctx.fillRect(-p.size.x/2 + 2, -p.size.y/2 - 5, p.size.x - 4, 25);
        
        // Visor/Eye
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(5, -p.size.y/2 + 5, 10, 4);

        // Scarf (Flows behind)
        ctx.beginPath();
        ctx.moveTo(-10, -p.size.y/2 + 10);
        ctx.lineTo(-40 - Math.abs(p.vel.x)*2, -p.size.y/2 + 5 + p.vel.y);
        ctx.lineTo(-10, -p.size.y/2 + 15);
        ctx.fillStyle = "#60a5fa";
        ctx.fill();

        // Sword (if attacking)
        if (p.currentAttack) {
             ctx.fillStyle = "#e2e8f0";
             ctx.fillRect(10, 0, 50, 5);
        }
    } else {
        // --- MECHA VISUALS ---
        // Legs
        ctx.fillStyle = "#334155";
        ctx.fillRect(-20, 15, 15, 20);
        ctx.fillRect(5, 15, 15, 20);

        // Torso (Bulky)
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(-p.size.x/2, -p.size.y/2 + 10, p.size.x, 40, 5);
        ctx.fill();

        // Shoulders
        ctx.fillStyle = "#991b1b";
        ctx.fillRect(-p.size.x/2 - 10, -p.size.y/2 + 5, 15, 25);
        ctx.fillRect(p.size.x/2 - 5, -p.size.y/2 + 5, 15, 25);

        // Core (Glowing)
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Head
        ctx.fillStyle = "#475569";
        ctx.fillRect(-15, -p.size.y/2 - 10, 30, 20);
        // Eye
        ctx.fillStyle = "#10b981"; // Green eye
        ctx.fillRect(0, -p.size.y/2 - 5, 12, 6);
    }

    ctx.restore();
  };

  const update = () => {
    const players = playersRef.current;
    
    players.forEach(p => {
      const config = p.id === 1 ? p1ConfigRef.current : p2ConfigRef.current;
      const stats = CHARACTERS[p.character];
      const keys = p.id === 1 
        ? { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyF', special: 'KeyG' }
        : { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', attack: 'KeyK', special: 'KeyL' };

      if (p.ledgeCooldown > 0) p.ledgeCooldown--;

      if (p.state === ActionState.DEAD) return;

      // Hitstun State Check
      if (p.state === ActionState.STUN) {
          p.stunFrames--;
          if (p.stunFrames <= 0) {
              p.state = ActionState.FALL;
          } else {
              // Apply friction in air during stun so they don't fly forever
              p.vel.x *= 0.98;
              p.vel.y += config.gravity;
          }
          // Continue to physics step even if stunned
      } else {
          // Normal Control Logic
          
          if (p.state === ActionState.SPECIAL_FALL) {
              // Helpless state
              p.vel.x *= 0.95; // Limited drift
              p.vel.y += config.gravity;
              if (keysPressed.current[keys.left]) p.vel.x -= 0.1;
              if (keysPressed.current[keys.right]) p.vel.x += 0.1;
          } else {
              const isAttacking = p.currentAttack !== null;
              // Cooldowns
              if (p.attackCooldown > 0) p.attackCooldown--;

              // Attacks
              if (p.attackCooldown <= 0 && !p.currentAttack) {
                  const initiateAttack = (attack: Hitbox, type: ActionState) => {
                        p.currentAttack = { ...attack };
                        p.attackFrame = 0;
                        p.state = type;
                        p.attackCooldown = attack.startupFrames + attack.activeFrames + 10; // Endlag
                        p.hitTargets = []; // Reset hit targets for new attack
                        
                        // Apply self velocity
                        if (attack.selfVelocity) {
                            const dir = p.facingRight ? 1 : -1;
                            p.vel.x = attack.selfVelocity.x * dir;
                            p.vel.y = attack.selfVelocity.y;
                        }
                  };

                   if (keysPressed.current[keys.attack]) {
                       if (keysPressed.current[keys.up]) initiateAttack(stats.standard.up, ActionState.ATTACK_UP);
                       else if (keysPressed.current[keys.down]) initiateAttack(stats.standard.down, ActionState.ATTACK_DOWN);
                       else if (keysPressed.current[keys.left] || keysPressed.current[keys.right]) initiateAttack(stats.standard.side, ActionState.ATTACK_SIDE);
                       else initiateAttack(stats.standard.neutral, ActionState.ATTACK_NEUTRAL);
                   } else if (keysPressed.current[keys.special]) {
                       if (keysPressed.current[keys.up]) {
                           initiateAttack(stats.special.up, ActionState.SPECIAL_UP);
                           p.hasUsedRecovery = true;
                       }
                       else if (keysPressed.current[keys.down]) initiateAttack(stats.special.down, ActionState.SPECIAL_DOWN);
                       else if (keysPressed.current[keys.left] || keysPressed.current[keys.right]) initiateAttack(stats.special.side, ActionState.SPECIAL_SIDE);
                       else initiateAttack(stats.special.neutral, ActionState.SPECIAL_NEUTRAL);
                   }
              }

              // Movement
              if (!isAttacking) {
                const maxMove = stats.speed * config.maxSpeed;
                const acc = stats.speed * config.moveSpeed;

                if (keysPressed.current[keys.left]) {
                  if (p.vel.x > -maxMove) p.vel.x -= acc;
                  p.facingRight = false;
                  if (p.isGrounded && p.state !== ActionState.RUN) p.state = ActionState.RUN;
                } else if (keysPressed.current[keys.right]) {
                  if (p.vel.x < maxMove) p.vel.x += acc;
                  p.facingRight = true;
                  if (p.isGrounded && p.state !== ActionState.RUN) p.state = ActionState.RUN;
                } else {
                  if (p.isGrounded) {
                    p.vel.x *= config.friction;
                  } else {
                    p.vel.x *= config.airResistance;
                  }
                  if (p.isGrounded && Math.abs(p.vel.x) < 0.1) p.state = ActionState.IDLE;
                }

                 // Jump logic
                if (keysPressed.current[keys.up]) {
                    const playerAny = p as any;
                    if (!playerAny.jumpKeyHeld && p.jumpsRemaining > 0) {
                        p.vel.y = p.jumpsRemaining === 2 ? config.jumpForce : config.doubleJumpForce;
                        p.jumpsRemaining--;
                        p.state = ActionState.JUMP;
                        playerAny.jumpKeyHeld = true;
                        spawnParticle(p.pos, '#ffffff', 5);
                    }
                } else {
                    (p as any).jumpKeyHeld = false;
                }

                // Fast Fall
                if (keysPressed.current[keys.down] && !p.isGrounded && p.vel.y > 0 && !p.currentAttack) {
                    p.vel.y = FAST_FALL_SPEED; // Use global constant for max fall speed consistency or add to config? Prompt didn't ask for Fast Fall tuning.
                }
              }
              
              // Gravity for normal state
              if (!p.isGrounded) {
                  p.vel.y += config.gravity;
                  // Apply terminal velocity (fall speed)
                  if (p.vel.y > config.fallSpeed) {
                      p.vel.y = config.fallSpeed;
                  }
              }
          }
      }

      // Attack Progression
      if (p.currentAttack) {
            p.attackFrame++;
            if (p.attackFrame > p.currentAttack.startupFrames + p.currentAttack.activeFrames) {
                p.currentAttack = null;
                p.attackFrame = 0;
                if (p.state === ActionState.SPECIAL_UP) {
                    p.state = ActionState.SPECIAL_FALL;
                } else {
                    p.state = ActionState.FALL;
                }
            }
      }

      // Apply Physics
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;

      // Blast Zones
      if (p.pos.y > STAGE_HEIGHT + 100 || p.pos.x < -BLAST_ZONE_PADDING || p.pos.x > STAGE_WIDTH + BLAST_ZONE_PADDING || p.pos.y < -BLAST_ZONE_PADDING) {
          p.stocks--;
          addLog(`Player ${p.id} KO'd!`);
          if (p.stocks > 0) {
              resetPlayer(p);
          } else {
              p.state = ActionState.DEAD;
              p.pos = { x: -9999, y: -9999 };
          }
      }

      // Collision with platforms
      p.isGrounded = false;
      PLATFORMS.forEach(plat => {
          if (p.vel.y >= 0 && // Falling
              p.pos.y + p.size.y >= plat.y && 
              p.pos.y + p.size.y <= plat.y + 20 &&
              p.pos.x + p.size.x > plat.x && 
              p.pos.x < plat.x + plat.w) {
                  
                  const keys = p.id === 1 
                    ? { down: 'KeyS' }
                    : { down: 'ArrowDown' };
                  
                  // Drop through check: If platform is NOT hard floor AND down key is pressed, do NOT collide.
                  if (plat.isHardFloor || !keysPressed.current[keys.down]) {
                      p.pos.y = plat.y - p.size.y;
                      p.vel.y = 0;
                      p.isGrounded = true;
                      p.jumpsRemaining = 2;
                      p.hasUsedRecovery = false;
                      if (p.state === ActionState.SPECIAL_FALL || p.state === ActionState.FALL || p.state === ActionState.JUMP) {
                          p.state = ActionState.IDLE;
                      }
                  }
          }
      });
    });

    // --- COMBAT ---
    const checkHit = (attacker: PlayerObj, target: PlayerObj) => {
        const atkConfig = attacker.id === 1 ? p1ConfigRef.current : p2ConfigRef.current;
        const targetConfig = target.id === 1 ? p1ConfigRef.current : p2ConfigRef.current;

        if (!attacker.currentAttack || 
            target.state === ActionState.DEAD || 
            attacker.hitTargets.includes(target.id) ||
            attacker.attackFrame < attacker.currentAttack.startupFrames) return;

        // Hitbox calc
        const atk = attacker.currentAttack;
        const dir = attacker.facingRight ? 1 : -1;
        const hitboxX = attacker.pos.x + attacker.size.x/2 + (atk.xOffset * dir) - (atk.width/2);
        const hitboxY = attacker.pos.y + attacker.size.y/2 + atk.yOffset - (atk.height/2);

        if (hitboxX < target.pos.x + target.size.x &&
            hitboxX + atk.width > target.pos.x &&
            hitboxY < target.pos.y + target.size.y &&
            hitboxY + atk.height > target.pos.y) {
                
            attacker.hitTargets.push(target.id);
            spawnParticle({x: hitboxX + atk.width/2, y: hitboxY + atk.height/2}, '#ff0000', 10, 15);
            
            target.percentage += atk.damage;

            // Determine scaling type
            const isSpecial = attacker.state >= ActionState.SPECIAL_NEUTRAL && attacker.state <= ActionState.SPECIAL_DOWN;
            const kbGlobalScale = isSpecial ? atkConfig.knockbackSpecialScale : atkConfig.knockbackNormalScale;

            const weight = CHARACTERS[target.character].weight;
            const kbScale = atk.knockbackScaling;
            const kbBase = atk.knockbackBase;
            
            const knockbackLen = ((target.percentage / 10 + (target.percentage * atk.damage) / 20) * (2.0 / weight) * 1.4 * kbScale * kbGlobalScale) + kbBase;
            
            let angle = atk.angle;
            if (!attacker.facingRight) angle = Math.PI - angle;

            // Apply KB
            target.vel.x = Math.cos(angle) * knockbackLen; 
            target.vel.y = Math.sin(angle) * knockbackLen;

            // Apply Hitstun
            const calculatedHitstun = (atk.damage * 0.6 + knockbackLen * 0.4 + 4) * atkConfig.hitstunScale;
            const hitstunFrames = atk.hitstun ? atk.hitstun * atkConfig.hitstunScale : calculatedHitstun;
            
            target.stunFrames = Math.floor(hitstunFrames);
            target.state = ActionState.STUN;
            
            target.currentAttack = null; 
            target.attackCooldown = 0;

            addLog(`P${attacker.id} hit P${target.id} (${Math.floor(target.percentage)}%)`);
        }
    };

    checkHit(playersRef.current[0], playersRef.current[1]);
    checkHit(playersRef.current[1], playersRef.current[0]);

    // --- RENDER ---
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        
        // Background
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

        // Platforms
        ctx.fillStyle = "#475569";
        PLATFORMS.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

        // Players
        playersRef.current.forEach(p => {
            if (p.state !== ActionState.DEAD) drawCharacter(ctx, p);
        });

        // Particles
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        particlesRef.current.forEach(p => {
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            p.life--;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
    }

    if (playersRef.current[0].stocks <= 0) onGameOver(2);
    else if (playersRef.current[1].stocks <= 0) onGameOver(1);
    else {
        setUiState({
            p1Percent: Math.floor(playersRef.current[0].percentage),
            p2Percent: Math.floor(playersRef.current[1].percentage),
            p1Stocks: playersRef.current[0].stocks,
            p2Stocks: playersRef.current[1].stocks
        });
        requestRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const renderTuningMenu = () => {
    if (!tuningPlayer) return null;
    const isP1 = tuningPlayer === 1;
    const config = isP1 ? p1Config : p2Config;
    const setConfig = isP1 ? setP1Config : setP2Config;
    const title = isP1 ? "P1 (Neon Blade) Config" : "P2 (Iron Titan) Config";
    const borderColor = isP1 ? "border-blue-500" : "border-red-500";

    return (
        <div className={`absolute top-14 ${isP1 ? 'left-4' : 'right-4'} z-30 w-64 bg-slate-900/95 backdrop-blur border ${borderColor} rounded-lg p-4 shadow-xl max-h-[600px] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-sm ${isP1 ? 'text-blue-400' : 'text-red-400'}`}>{title}</h3>
                <div className="flex gap-2">
                    <button onClick={() => resetTuning(tuningPlayer)} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                       <RotateCcw size={12} /> Reset
                    </button>
                    <button onClick={() => setTuningPlayer(null)} className="text-slate-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
                {/* Gravity */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label>Gravity</label>
                        <span>{config.gravity.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0.1" max="1.0" step="0.05" 
                           value={config.gravity} 
                           onChange={(e) => setConfig({...config, gravity: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Move Speed */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label>Move Speed</label>
                        <span>{config.moveSpeed.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0.1" max="2.0" step="0.1" 
                           value={config.moveSpeed} 
                           onChange={(e) => setConfig({...config, moveSpeed: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Fall Speed */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label>Fall Speed (Terminal Vel)</label>
                        <span>{config.fallSpeed.toFixed(1)}</span>
                    </div>
                    <input type="range" min="2.0" max="20.0" step="0.5" 
                           value={config.fallSpeed} 
                           onChange={(e) => setConfig({...config, fallSpeed: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Jump Force */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label>Jump Force</label>
                        <span>{config.jumpForce.toFixed(1)}</span>
                    </div>
                    <input type="range" min="-20" max="-5" step="0.5" 
                           value={config.jumpForce} 
                           onChange={(e) => setConfig({...config, jumpForce: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Double Jump */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label>Double Jump</label>
                        <span>{config.doubleJumpForce.toFixed(1)}</span>
                    </div>
                    <input type="range" min="-20" max="-5" step="0.5" 
                           value={config.doubleJumpForce} 
                           onChange={(e) => setConfig({...config, doubleJumpForce: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Ground Friction */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label>Ground Friction</label>
                        <span>{config.friction.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0.5" max="0.99" step="0.01" 
                           value={config.friction} 
                           onChange={(e) => setConfig({...config, friction: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Air Resistance */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label>Air Resistance</label>
                        <span>{config.airResistance.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0.8" max="1.0" step="0.01" 
                           value={config.airResistance} 
                           onChange={(e) => setConfig({...config, airResistance: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Knockback Normal */}
                <div className="pt-2 border-t border-slate-700">
                     <div className="flex justify-between mb-1">
                        <label className="text-white">Knockback (Normal)</label>
                        <span>{config.knockbackNormalScale.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.1" max="3.0" step="0.1" 
                           value={config.knockbackNormalScale} 
                           onChange={(e) => setConfig({...config, knockbackNormalScale: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Knockback Special */}
                <div>
                     <div className="flex justify-between mb-1">
                        <label className="text-white">Knockback (Special)</label>
                        <span>{config.knockbackSpecialScale.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.1" max="3.0" step="0.1" 
                           value={config.knockbackSpecialScale} 
                           onChange={(e) => setConfig({...config, knockbackSpecialScale: parseFloat(e.target.value)})} 
                           className="w-full accent-slate-500" />
                </div>

                {/* Hitstun */}
                 <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-yellow-400">Hitstun Scale</label>
                        <span>{config.hitstunScale.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.1" max="3.0" step="0.1" 
                           value={config.hitstunScale} 
                           onChange={(e) => setConfig({...config, hitstunScale: parseFloat(e.target.value)})} 
                           className="w-full accent-yellow-500" />
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="relative">
        {renderTuningMenu()}

        {/* HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white font-display z-10 pointer-events-none">
            <div className="flex flex-col items-start pointer-events-auto">
                <div className="flex items-center gap-2">
                    <div className="text-xl text-blue-400">NEON BLADE</div>
                    <button onClick={() => setTuningPlayer(tuningPlayer === 1 ? null : 1)} className="text-slate-500 hover:text-blue-400 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
                <div className="text-4xl">{uiState.p1Percent}%</div>
                <div className="flex gap-1 mt-1">
                    {[...Array(uiState.p1Stocks)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center pt-2">
                <div className="bg-black/50 px-4 py-1 rounded text-sm text-yellow-400 border border-yellow-500/30 backdrop-blur">
                    {commentary}
                </div>
            </div>

            <div className="flex flex-col items-end mr-10 pointer-events-auto">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setTuningPlayer(tuningPlayer === 2 ? null : 2)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Settings size={18} />
                    </button>
                    <div className="text-xl text-red-400">IRON TITAN</div>
                </div>
                <div className="text-4xl">{uiState.p2Percent}%</div>
                <div className="flex gap-1 mt-1">
                    {[...Array(uiState.p2Stocks)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"></div>
                    ))}
                </div>
            </div>
        </div>

        <canvas 
            ref={canvasRef} 
            width={STAGE_WIDTH} 
            height={STAGE_HEIGHT} 
            className="border-t border-b border-slate-700 bg-slate-900 shadow-2xl max-w-full h-auto"
        />
    </div>
  );
};
