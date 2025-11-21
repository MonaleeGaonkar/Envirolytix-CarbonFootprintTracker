import React, { useEffect, useReducer, useRef } from 'react';

// --- Game Constants ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const GROUND_Y = GAME_HEIGHT - 30;

const PLAYER_WIDTH = 42;
const PLAYER_HEIGHT = 48;
const PLAYER_DUCK_HEIGHT = 28;
const PLAYER_X_POSITION = 50;

const PLAYER_JUMP_VELOCITY = 14;
const GRAVITY = 0.6;
const DUCK_GRAVITY_MULTIPLIER = 4;

const OBSTACLE_MIN_GAP = 300;
const OBSTACLE_MAX_GAP = 700;
const INITIAL_GAME_SPEED = 5;
const GAME_SPEED_INCREMENT = 0.001;

// --- Interfaces ---
interface PlayerState {
  y: number;
  vy: number;
  height: number;
  animationFrame: number;
}

interface ObstacleState {
  x: number;
  width: number;
  height: number;
  type: 'smokestack' | 'barrel' | 'trash';
  nextGap?: number;
}

interface GameState {
  status: 'idle' | 'running' | 'gameOver';
  player: PlayerState;
  obstacles: ObstacleState[];
  score: number;
  highScore: number;
  gameSpeed: number;
  isJumping: boolean;
  isDucking: boolean;
  frameCount: number;
  backgroundX1: number;
  backgroundX2: number;
  cloudX1: number;
  cloudX2: number;
}

type GameAction =
  | { type: 'TICK'; deltaTime: number }
  | { type: 'USER_INPUT_START' }
  | { type: 'USER_INPUT_END' }
  | { type: 'USER_DUCK_START' }
  | { type: 'USER_DUCK_END' };

// --- Reducer (Game Logic) ---
const initialState: GameState = {
  status: 'idle',
  player: { y: GROUND_Y - PLAYER_HEIGHT, vy: 0, height: PLAYER_HEIGHT, animationFrame: 0 },
  obstacles: [],
  score: 0,
  highScore: typeof window !== 'undefined' ? parseInt(localStorage.getItem('ecoJumperHighScore') || '0', 10) : 0,
  gameSpeed: INITIAL_GAME_SPEED,
  isJumping: false,
  isDucking: false,
  frameCount: 0,
  backgroundX1: 0,
  backgroundX2: GAME_WIDTH,
  cloudX1: 0,
  cloudX2: GAME_WIDTH,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'USER_INPUT_START': {
      if (state.status === 'idle' || state.status === 'gameOver') {
        return {
          ...initialState,
          status: 'running',
          highScore: state.highScore,
        };
      }
      if (state.status === 'running' && state.player.y >= GROUND_Y - state.player.height && !state.isDucking) {
        return {
          ...state,
          player: { ...state.player, vy: -PLAYER_JUMP_VELOCITY },
          isJumping: true,
        };
      }
      return state;
    }

    case 'USER_INPUT_END': {
      if (state.status === 'running') {
        return { ...state, isJumping: false };
      }
      return state;
    }
      
    case 'USER_DUCK_START': {
      if (state.status === 'running' && !state.isJumping) {
        return { ...state, isDucking: true, player: {...state.player, height: PLAYER_DUCK_HEIGHT} };
      }
      return state;
    }

    case 'USER_DUCK_END': {
      if (state.status === 'running') {
        return { ...state, isDucking: false, player: {...state.player, height: PLAYER_HEIGHT} };
      }
      return state;
    }
      
    case 'TICK':
      if (state.status !== 'running') return state;

      const { deltaTime } = action;
      let { player, obstacles, score, gameSpeed, isJumping, isDucking, frameCount, backgroundX1, backgroundX2, cloudX1, cloudX2 } = state;

      let currentGravity = GRAVITY;
      if (player.vy < 0 && !isJumping) { 
        currentGravity *= 3;
      }
      if (isDucking && player.y < GROUND_Y - player.height) {
        currentGravity *= DUCK_GRAVITY_MULTIPLIER;
      }
      
      let newVy = player.vy + currentGravity * (deltaTime / 16);
      let newY = player.y + newVy * (deltaTime / 16);

      const groundPosition = GROUND_Y - player.height;
      if (newY >= groundPosition) {
        newY = groundPosition;
        newVy = 0;
      }
      
      const newFrameCount = frameCount + 1;
      const newAnimationFrame = newY < groundPosition ? 0 : Math.floor(newFrameCount / 6) % 2;

      const newPlayer = { ...player, y: newY, vy: newVy, animationFrame: newAnimationFrame };

      const updatedObstacles = obstacles
        .map(o => ({ ...o, x: o.x - gameSpeed * (deltaTime / 16) }))
        .filter(o => o.x > -o.width);

      const lastObstacle = updatedObstacles[updatedObstacles.length - 1];
      if (!lastObstacle || (GAME_WIDTH - lastObstacle.x) > (lastObstacle.nextGap || OBSTACLE_MIN_GAP)) {
          
        const obstacleTypes: ObstacleState['type'][] = ['smokestack', 'barrel', 'trash'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        let newObstacle: ObstacleState;
        
        const nextGap = OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP);

        switch(type) {
            case 'smokestack':
                 newObstacle = { x: GAME_WIDTH, width: 25, height: 60, type, nextGap };
                 break;
            case 'barrel':
                 newObstacle = { x: GAME_WIDTH, width: 30, height: 40, type, nextGap };
                 break;
            case 'trash':
            default:
                 newObstacle = { x: GAME_WIDTH, width: 50, height: 35, type, nextGap };
                 break;
        }

        updatedObstacles.push(newObstacle);
      }
      
      let newStatus: GameState['status'] = state.status;
      for (const obstacle of updatedObstacles) {
          const playerBox = { x: PLAYER_X_POSITION, y: newPlayer.y, width: PLAYER_WIDTH, height: newPlayer.height };
          const obstacleBox = { x: obstacle.x, y: GROUND_Y - obstacle.height, width: obstacle.width, height: obstacle.height };
          
          if (
              playerBox.x < obstacleBox.x + obstacleBox.width &&
              playerBox.x + playerBox.width > obstacleBox.x &&
              playerBox.y < obstacleBox.y + obstacleBox.height &&
              playerBox.y + playerBox.height > obstacleBox.y
          ) {
              newStatus = 'gameOver';
          }
      }

      const newScore = score + (gameSpeed / 10) * (deltaTime / 16);
      let newHighScore = state.highScore;
      const finalScore = Math.floor(newScore);
      if (newStatus === 'gameOver' && finalScore > state.highScore) {
        newHighScore = finalScore;
        if (typeof window !== 'undefined') {
          localStorage.setItem('ecoJumperHighScore', newHighScore.toString());
        }
      }
      
      // Background Scrolling Logic
      const groundSpeed = gameSpeed * (deltaTime / 16);
      let newBackgroundX1 = backgroundX1 - groundSpeed;
      let newBackgroundX2 = backgroundX2 - groundSpeed;
      if (newBackgroundX1 <= -GAME_WIDTH) newBackgroundX1 = GAME_WIDTH;
      if (newBackgroundX2 <= -GAME_WIDTH) newBackgroundX2 = GAME_WIDTH;

      const cloudSpeed = (gameSpeed / 4) * (deltaTime / 16);
      let newCloudX1 = cloudX1 - cloudSpeed;
      let newCloudX2 = cloudX2 - cloudSpeed;
      if (newCloudX1 <= -GAME_WIDTH) newCloudX1 = GAME_WIDTH;
      if (newCloudX2 <= -GAME_WIDTH) newCloudX2 = GAME_WIDTH;
      
      return {
        ...state,
        status: newStatus,
        player: newPlayer,
        obstacles: updatedObstacles,
        score: newScore,
        highScore: newHighScore,
        gameSpeed: gameSpeed + GAME_SPEED_INCREMENT * (deltaTime / 16),
        frameCount: newFrameCount,
        backgroundX1: newBackgroundX1,
        backgroundX2: newBackgroundX2,
        cloudX1: newCloudX1,
        cloudX2: newCloudX2,
      };

    default:
      return state;
  }
};

// --- React Components ---
const Background: React.FC<{ x: number; frameCount: number }> = ({ x, frameCount }) => {
  const turbineRotation = (frameCount * 2) % 360;
  return (
    <g transform={`translate(${x}, 0)`}>
      {/* Sky */}
      <rect x="0" y="0" width={GAME_WIDTH} height={GROUND_Y} fill="#a0e0ff" />
      {/* City */}
      <path d="M50 120 h40 v50 h-40Z M100 100 h30 v70 h-30Z M140 130 h50 v40 h-50Z M200 110 h25 v60 h-25Z M230 90 h40 v80 h-40Z M280 140 h30 v30 h-30Z M320 100 h50 v70 h-50Z M380 125 h20 v45 h-20Z M410 95 h40 v75 h-40Z M460 135 h30 v35 h-30Z M500 115 h25 v55 h-25Z M550 105 h40 v65 h-40Z M600 120 h30 v50 h-30Z M640 100 h50 v70 h-50Z M700 130 h40 v40 h-40Z M750 110 h30 v60 h-30Z" fill="#c0d0e0" />
      {/* Wind Turbines & Trees */}
      {[100, 250, 400, 550, 700].map(tx => (
        <g key={tx}>
          <path d={`M${tx} 120 v-60 h4 v60 h-4Z`} fill="#f0f0f0" />
          <g transform={`translate(${tx + 2}, 60) rotate(${turbineRotation})`}>
            <path d="M0 0 l-2 -2 l0 -20 l4 0 l0 20 l-2 2Z" fill="#ffffff" transform="rotate(0)" />
            <path d="M0 0 l-2 -2 l0 -20 l4 0 l0 20 l-2 2Z" fill="#ffffff" transform="rotate(120)" />
            <path d="M0 0 l-2 -2 l0 -20 l4 0 l0 20 l-2 2Z" fill="#ffffff" transform="rotate(240)" />
          </g>
        </g>
      ))}
      {[180, 330, 480, 630].map(sx => (
        <g key={sx}>
            <path d={`M${sx} 160 h30 v10 h-30Z`} fill="#4a90e2" />
            <path d={`M${sx+2} 150 h8 v10 h-8Z M${sx+12} 150 h8 v10 h-8Z M${sx+22} 150 h8 v10 h-8Z`} fill="#a0d0f0"/>
        </g>
      ))}
      {[80, 220, 370, 520, 670].map(tx => (
        <g key={tx}>
          <path d={`M${tx} 150 v-20 h8 v20 h-8Z`} fill="#6d4c22"/>
          <path d={`M${tx-10} 110 h28 v20 h-28Z`} fill="#78ab2c"/>
        </g>
      ))}
      {/* Ground */}
      <rect x="0" y={GROUND_Y} width={GAME_WIDTH} height={GAME_HEIGHT - GROUND_Y} fill="#b9936c" />
      <rect x="0" y={GROUND_Y} width={GAME_WIDTH} height={10} fill="#78ab2c" />
      {/* Flowers */}
      {[50, 200, 350, 500, 650, 750].map(fx => <path key={fx} d={`M${fx} ${GROUND_Y} v-5 h2 v5 M${fx-2} ${GROUND_Y-7} h6 v2 h-6Z`} fill="#ff6b6b"/>)}
    </g>
  );
};

const Clouds: React.FC<{ x: number }> = ({ x }) => (
    <g transform={`translate(${x}, 0)`}>
      <path d="M100 40 h50 v20 h-50Z M110 35 h30 v30 h-30Z" fill="#ffffff" />
      <path d="M250 60 h80 v25 h-80Z M270 50 h40 v45 h-40Z" fill="#ffffff" />
      <path d="M450 30 h60 v20 h-60Z M460 25 h40 v30 h-40Z" fill="#ffffff" />
      <path d="M650 50 h70 v25 h-70Z M660 40 h50 v45 h-50Z" fill="#ffffff" />
    </g>
);

const Player: React.FC<{ player: PlayerState, isDucking: boolean }> = ({ player, isDucking }) => {
    const { y, animationFrame } = player;

    const runningBody = (
    <g>
        {/* Main Body */}
        <path d="M12 14 H28 V35 H12 V14 Z" fill="#78ab2c"/>
        <path d="M12 14 v-1 h16 v1 h1 v21 h-1 v1 H12 v-1 h-1 V14 Z M13 14 h14 v21 H13 Z" fill="#5c8a22"/>
        {/* Head */}
        <path d="M14 6 H26 V14 H14 V6 Z" fill="#78ab2c"/>
        <path d="M14 6 v-1 h12 v1 h1 v8 h-1 v1 H14 v-1 h-1 V6 Z M15 7 h10 v6 H15 Z" fill="#5c8a22"/>
        {/* Leaves on head */}
        <path d="M18 6 V4 H16 V2 H18 V0 H20 V2 H22 V4 H20 V6Z M14 6 V4 H12 V2 H14 V0 H16 V2 H18 V4 H16 V6Z" fill="#78ab2c"/>
        <path d="M18 0 v2 h-2 v2 h-2 v2 h-2 v-2 h2 V2 h2 V0 Z M20 2 v2 h2 v2 h-2 V4 h-2 V2 Z" fill="#5c8a22"/>
        {/* Eyes */}
        <path d="M17 9 H19 V11 H17 V9 Z M21 9 H23 V11 H21 V9 Z" fill="white"/>
        {/* Mouth */}
        <path d="M18 12 H22 V13 H18 V12 Z" fill="#5c8a22"/>
        {/* Chest Leaf */}
        <path d="M19 25 l-3 2 v-3 l2 -2 l2 2 v3 Z" fill="#5c8a22"/>
        <path d="M19 25 l-2 1 v-2 l1 -1 l2 1 v2 Z" fill="#78ab2c"/>
    </g>
    );
    
    const runningLegsFrame1 = (
     <g>
        {/* Left Leg (behind) */}
        <path d="M12 35 h6 v3 h-2 v5 h-4 v-5 h-2 v-3 Z M21 35 h6 v3 h-2 v5 h-4 v-5 h-2 v-3 Z" fill="#5c8a22"/>
        <path d="M14 38 h2 v5 h-2 Z M23 38 h2 v5 h-2 Z" fill="#78ab2c"/>
        {/* Right Leg (front) */}
        <path d="M21 35 L27 35 L27 38 L25 38 L25 43 L21 43 L21 38 L19 38 L19 35 Z" fill="#5c8a22"  transform="translate(-6 -3)"/>
        <path d="M23 43 L21 43 L21 38 L23 38 Z" fill="#78ab2c" transform="translate(-6 -3)"/>
     </g>
    );

     const runningLegsFrame2 = (
     <g>
        {/* Left Leg (behind) */}
        <path d="M21 35 L27 35 L27 38 L25 38 L25 43 L21 43 L21 38 L19 38 L19 35 Z" fill="#5c8a22" transform="translate(0, -3)"/>
        <path d="M23 43 L21 43 L21 38 L23 38 Z" fill="#78ab2c" transform="translate(0, -3)"/>
        {/* Right Leg (front) */}
        <path d="M12 35 L18 35 L18 38 L16 38 L16 43 L12 43 L12 38 L10 38 L10 35 Z" fill="#5c8a22" transform="translate(6, -3)"/>
        <path d="M14 43 L12 43 L12 38 L14 38 Z" fill="#78ab2c" transform="translate(6, -3)"/>
     </g>
    );

    const armsFrame1 = (
    <g>
        {/* Left Arm */}
        <path d="M7 16 H12 V22 H7 V16 Z" fill="#78ab2c" />
        <path d="M7 16 v-1 h5 v1 h1 v6 h-1 v1 H7 v-1 h-1 V16 Z M8 16 h3 v6 H8 Z" fill="#5c8a22"/>
        {/* Right Arm */}
        <path d="M28 19 H33 V25 H28 V19 Z" fill="#78ab2c" />
        <path d="M28 19 v-1 h5 v1 h1 v6 h-1 v1 H28 v-1 h-1 V19 Z M29 19 h3 v6 H29 Z" fill="#5c8a22"/>
    </g>
    );
    
    const armsFrame2 = (
    <g>
        {/* Left Arm */}
        <path d="M7 19 H12 V25 H7 V19 Z" fill="#78ab2c" />
        <path d="M7 19 v-1 h5 v1 h1 v6 h-1 v1 H7 v-1 h-1 V19 Z M8 19 h3 v6 H8 Z" fill="#5c8a22"/>
        {/* Right Arm */}
        <path d="M28 16 H33 V22 H28 V16 Z" fill="#78ab2c" />
        <path d="M28 16 v-1 h5 v1 h1 v6 h-1 v1 H28 v-1 h-1 V16 Z M29 16 h3 v6 H29 Z" fill="#5c8a22"/>
    </g>
    );

    const duckingBody = (
        <g>
            {/* Main Body */}
            <path d="M12 24 H28 V35 H12 V24 Z" fill="#78ab2c"/>
            <path d="M12 24 v-1 h16 v1 h1 v11 h-1 v1 H12 v-1 h-1 V24 Z M13 24 h14 v11 H13 Z" fill="#5c8a22"/>
            {/* Head */}
            <path d="M14 16 H26 V24 H14 V16 Z" fill="#78ab2c"/>
            <path d="M14 16 v-1 h12 v1 h1 v8 h-1 v1 H14 v-1 h-1 V16 Z M15 17 h10 v6 H15 Z" fill="#5c8a22"/>
            {/* Leaves */}
            <path d="M18 16 V14 H16 V12 H18 V10 H20 V12 H22 V14 H20 V16Z M14 16 V14 H12 V12 H14 V10 H16 V12 H18 V14 H16 V16Z" fill="#78ab2c"/>
            <path d="M18 10 v2 h-2 v2 h-2 v2 h-2 v-2 h2 V12 h2 V10 Z M20 12 v2 h2 v2 h-2 V14 h-2 V12 Z" fill="#5c8a22"/>
            {/* Eyes */}
            <path d="M17 19 H19 V21 H17 V19 Z M21 19 H23 V21 H21 V19 Z" fill="white"/>
            {/* Mouth */}
            <path d="M18 22 H22 V23 H18 V22 Z" fill="#5c8a22"/>
            {/* Boots */}
            <path d="M10 35 h10 v8 h-10 Z M30 35 h10 v8 h-10 Z" fill="#a5682a"/>
            <path d="M10 35 v-1 h10 v1 h1 v8 h-1 v1 H10 v-1 h-1 V35 Z M11 35 h8 v8 h-8 Z M31 35 h8 v8 h-8 Z" fill="#6d4c22"/>
        </g>
    );

    const boots = (
        <g>
            <path d="M6 43 h10 v5 h-10 Z M27 43 h10 v5 h-10 Z" fill="#a5682a"/>
            <path d="M6 43 v-1 h10 v1 h1 v5 h-1 v1 H6 v-1 h-1 V43 Z M7 43 h8 v5 H7 Z M28 43 h8 v5 H28 Z" fill="#6d4c22"/>
        </g>
    );

    return (
        <svg x={PLAYER_X_POSITION} y={y} width={PLAYER_WIDTH} height={PLAYER_HEIGHT} >
            { isDucking ? 
                duckingBody :
            (
                <g>
                    {animationFrame === 0 ? armsFrame1 : armsFrame2}
                    {runningBody}
                    {animationFrame === 0 ? runningLegsFrame1 : runningLegsFrame2}
                    {boots}
                </g>
            )
            }
        </svg>
    );
};

const Obstacle: React.FC<{ obstacle: ObstacleState }> = ({ obstacle }) => {
    const obstacleSVG = {
        smokestack: (
             <g>
                <path d="M2 30 H23 V58 H2 V30 Z" fill="#bdbdbd"/>
                <path d="M2 30 v-1 h21 v1 h1 v28 h-1 v1 H2 v-1 h-1 V30 Z M3 30 h19 v28 H3 Z" fill="#757575"/>
                <path d="M5 5 V30 H15 V5 Z" fill="#e0e0e0"/>
                <path d="M5 5 v-1 h10 v1 h1 v25 h-1 v1 H5 v-1 h-1 V5 Z M6 5 h8 v25 H6 Z" fill="#9e9e9e"/>
                {/* Smoke */}
                <path d="M15 12 h4 v4 h-4 Z M19 8 h4 v4 h-4 Z M23 12 h4 v4 h-4 Z M17 4 h4 v4 h-4 Z" fill="#424242"/>
            </g>
        ),
        barrel: (
            <g>
                <path d="M2 15 H28 V40 H2 V15 Z" fill="#a1887f"/>
                <path d="M2 15 v-1 h26 v1 h1 v25 h-1 v1 H2 v-1 h-1 V15 Z M3 15 h24 v25 H3 Z" fill="#5d4037"/>
                <path d="M2 20 H28 V25 H2 Z M2 30 H28 V35 H2 Z" fill="#795548"/>
                {/* Drip */}
                <path d="M25 40 h5 v5 h-5 Z" fill="#4caf50"/>
                <path d="M22 35 v5 h2 v-5 Z" fill="#4caf50"/>
            </g>
        ),
        trash: (
            <g>
                <path d="M2 15 H25 V35 H2 Z" fill="#424242"/>
                <path d="M2 15 v-1 h23 v1 h1 v20 h-1 v1 H2 v-1 h-1 V15 Z M3 15 h21 v20 H3 Z" fill="#212121"/>
                <path d="M20 10 H40 V35 H20 Z" fill="#616161"/>
                <path d="M20 10 v-1 h20 v1 h1 v25 h-1 v1 H20 v-1 h-1 V10 Z M21 10 h18 v25 H21 Z" fill="#424242"/>
                 {/* Bottle */}
                <path d="M40 25 h8 v3 h-8 Z M42 20 h4 v5 h-4 Z" fill="#81c784"/>
            </g>
        ),
    }

    return (
        <svg x={obstacle.x} y={GROUND_Y - obstacle.height} width={obstacle.width} height={obstacle.height} >
            {obstacleSVG[obstacle.type]}
        </svg>
    );
};

const DinoGame: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Game Loop Effect
  useEffect(() => {
    if (state.status !== 'running') return;

    let frameId: number;
    let lastTime = performance.now();
    
    const gameLoop = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      dispatch({ type: 'TICK', deltaTime });
      frameId = requestAnimationFrame(gameLoop);
    };

    frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, [state.status]);

  // Input Handling Effect
  useEffect(() => {
    const dispatchRef = (action: GameAction) => dispatch(action);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            dispatchRef({ type: 'USER_INPUT_START' });
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            dispatchRef({ type: 'USER_DUCK_START' });
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            dispatchRef({ type: 'USER_INPUT_END' });
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            dispatchRef({ type: 'USER_DUCK_END' });
        }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      dispatchRef({ type: 'USER_INPUT_START' });
    };
    
    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      dispatchRef({ type: 'USER_INPUT_END' });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const container = gameContainerRef.current;
    if (container) {
      container.addEventListener('mousedown', handlePointerDown);
      container.addEventListener('mouseup', handlePointerUp);
      container.addEventListener('touchstart', handlePointerDown, { passive: false });
      container.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (container) {
        container.removeEventListener('mousedown', handlePointerDown);
        container.removeEventListener('mouseup', handlePointerUp);
        container.removeEventListener('touchstart', handlePointerDown);
        container.removeEventListener('touchend', handlePointerUp);
      }
    };
  }, []); 

  return (
    <div
      ref={gameContainerRef}
      className="relative w-full max-w-3xl mx-auto h-52 mb-8 overflow-hidden rounded-lg shadow-inner bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 select-none cursor-pointer focus:outline-none"
      tabIndex={0}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}>
        
        {/* BACKGROUND RENDER */}
        <Clouds x={state.cloudX1} />
        <Clouds x={state.cloudX2} />
        <Background x={state.backgroundX1} frameCount={state.frameCount} />
        <Background x={state.backgroundX2} frameCount={state.frameCount} />

        {state.status !== 'idle' && (
          <>
            <Player player={state.player} isDucking={state.isDucking} />
            {state.obstacles.map((obstacle, i) => (
              <Obstacle key={i} obstacle={obstacle} />
            ))}
          </>
        )}

        <text x={GAME_WIDTH - 10} y="20" textAnchor="end" className="font-mono text-lg font-bold fill-current text-slate-500">
          HI {state.highScore.toString().padStart(5, '0')} {Math.floor(state.score).toString().padStart(5, '0')}
        </text>

        {(state.status === 'idle' || state.status === 'gameOver') && (
            <g>
                <rect x="0" y="0" width={GAME_WIDTH} height={GAME_HEIGHT} className="fill-current text-slate-100/70 dark:text-slate-800/70" />
                <text x={GAME_WIDTH / 2} y={GAME_HEIGHT / 2 - 20} textAnchor="middle" className="text-4xl font-bold fill-current text-slate-800 dark:text-slate-200">
                    {state.status === 'gameOver' ? 'Game Over' : 'Eco Jumper'}
                </text>
                 <text x={GAME_WIDTH / 2} y={GAME_HEIGHT / 2 + 20} textAnchor="middle" className="text-lg fill-current text-slate-500 dark:text-slate-400">
                    {state.status === 'gameOver' ? `Score: ${Math.floor(state.score)}` : `High Score: ${state.highScore}`}
                </text>
                <text x={GAME_WIDTH / 2} y={GAME_HEIGHT / 2 + 50} textAnchor="middle" className="text-md fill-current text-slate-500 dark:text-slate-400 animate-pulse">
                   Press Space or Tap to Play
                </text>
            </g>
        )}
      </svg>
    </div>
  );
};

export default DinoGame;