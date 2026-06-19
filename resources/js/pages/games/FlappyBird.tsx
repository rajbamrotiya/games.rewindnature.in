import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, HelpCircle, X, RotateCcw, Maximize, Minimize, Menu } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { submitScore } from '@/lib/leaderboard';
import { useFullscreen } from '@/hooks/use-fullscreen';

interface Stats {
    name: string;
    wins: number;
    losses: number;
    highScore: number;
}

const GAME_HEIGHT = 1000;
const GRAVITY = 0.55;
const JUMP_STRENGTH = -11;
const PIPE_SPEED = 5.5;
const PIPE_WIDTH = 120;
const GAP_SIZE = 280;
const BIRD_RADIUS = 24;

export default function FlappyBird() {
    const { appearance, updateAppearance } = useAppearance();
    const toggleTheme = () => updateAppearance(appearance === 'dark' ? 'light' : 'dark');

    const [stats, setStats] = useState<Stats | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [showRules, setShowRules] = useState(false);
    const { isFullscreen, toggleFullscreen, elementRef } = useFullscreen<HTMLDivElement>();
    const [showFullscreenInfo, setShowFullscreenInfo] = useState(false);

    useEffect(() => {
        if (!isFullscreen) setShowFullscreenInfo(false);
    }, [isFullscreen]);

    // Game state
    const [isPlaying, setIsPlaying] = useState(() => localStorage.getItem('flappy_isPlaying') === 'true');
    const [isGameOver, setIsGameOver] = useState(() => localStorage.getItem('flappy_isGameOver') === 'true');
    const [score, setScore] = useState(() => parseInt(localStorage.getItem('flappy_score') || '0', 10));
    const [message, setMessage] = useState(() => localStorage.getItem('flappy_message') || 'Press Space or Tap to Jump!');
    
    // Canvas reference for rendering
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    
    // Game variables (refs to avoid re-renders during loop)
    const bird = useRef(JSON.parse(localStorage.getItem('flappy_bird') || 'null') || { y: 500, velocity: 0 });
    const pipes = useRef(JSON.parse(localStorage.getItem('flappy_pipes') || 'null') || []);
    const frameCount = useRef(parseInt(localStorage.getItem('flappy_frameCount') || '0', 10));

    useEffect(() => {
        localStorage.setItem('flappy_isPlaying', isPlaying.toString());
        localStorage.setItem('flappy_isGameOver', isGameOver.toString());
        localStorage.setItem('flappy_score', score.toString());
        localStorage.setItem('flappy_message', message);
        localStorage.setItem('flappy_bird', JSON.stringify(bird.current));
        localStorage.setItem('flappy_pipes', JSON.stringify(pipes.current));
        localStorage.setItem('flappy_frameCount', frameCount.current.toString());
    }, [isPlaying, isGameOver, score, message]);

    // Load stats on mount
    useEffect(() => {
        const savedStats = localStorage.getItem('rewind_games_stats');
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            if (!parsed.highScore) parsed.highScore = 0;
            setStats(parsed);
        }
    }, []);

    const handleSaveName = () => {
        if (!nameInput.trim()) return;
        const newStats = { name: nameInput.trim(), wins: 0, losses: 0, highScore: 0 };
        setStats(newStats);
        localStorage.setItem('rewind_games_stats', JSON.stringify(newStats));
    };

    const updateStats = (newScore: number) => {
        if (!stats) return;
        const newStats = { ...stats };
        newStats.losses += 1;
        if (newScore > (stats.highScore || 0)) {
            newStats.highScore = newScore;
            setMessage(`New High Score: ${newScore}!`);
        } else {
            setMessage(`Game Over! Score: ${newScore}`);
        }
        setStats(newStats);
        localStorage.setItem('rewind_games_stats', JSON.stringify(newStats));
        submitScore('flappy-bird', stats.name, { score: newScore, loss: true });
    };

    const resetGame = () => {
        bird.current = { y: 500, velocity: 0 };
        pipes.current = [];
        frameCount.current = 0;
        setScore(0);
        setIsGameOver(false);
        setIsPlaying(true);
        setMessage('');
        localStorage.removeItem('flappy_bird');
        localStorage.removeItem('flappy_pipes');
        localStorage.removeItem('flappy_frameCount');
    };

    const jump = () => {
        if (!isPlaying && !isGameOver) {
            resetGame();
        } else if (isPlaying) {
            bird.current.velocity = JUMP_STRENGTH;
        } else if (isGameOver) {
            resetGame();
        }
    };

    const drawBird = (ctx: CanvasRenderingContext2D, scale: number, birdX: number, isDark: boolean) => {
        const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.current.velocity * 0.08)));
        ctx.save();
        ctx.translate(birdX * scale, bird.current.y * scale);
        ctx.rotate(angle);

        // Body
        ctx.fillStyle = '#fbbf24'; // amber-400
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_RADIUS * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = '#b45309'; // amber-700
        ctx.stroke();

        // Wing
        const wingY = Math.sin(frameCount.current * 0.4) * 8 * scale;
        ctx.fillStyle = '#f59e0b'; // amber-500
        ctx.beginPath();
        ctx.ellipse(-5 * scale, wingY, 14 * scale, 9 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(10 * scale, -8 * scale, 7 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(12 * scale, -8 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.beginPath();
        ctx.moveTo(14 * scale, 2 * scale);
        ctx.lineTo(32 * scale, 6 * scale);
        ctx.lineTo(14 * scale, 12 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    };

    const drawPipe = (ctx: CanvasRenderingContext2D, scale: number, x: number, y: number, width: number, height: number, isTop: boolean) => {
        const capHeight = 40 * scale;
        const capExcess = 10 * scale;
        
        // Gradient
        const gradient = ctx.createLinearGradient(x * scale, y * scale, (x + width) * scale, y * scale);
        gradient.addColorStop(0, '#4ade80');
        gradient.addColorStop(0.5, '#22c55e');
        gradient.addColorStop(1, '#16a34a');
        
        ctx.fillStyle = gradient;
        ctx.lineWidth = 4 * scale;
        ctx.strokeStyle = '#14532d';
        
        // Main pipe
        ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
        ctx.strokeRect(x * scale, y * scale, width * scale, height * scale);
        
        // Cap
        const capY = isTop ? y + height - (capHeight / scale) : y;
        ctx.fillRect((x - 10) * scale, capY * scale, (width + 20) * scale, capHeight);
        ctx.strokeRect((x - 10) * scale, capY * scale, (width + 20) * scale, capHeight);
    };

    const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scale: number, gameWidth: number, isDark: boolean) => {
        // Draw City / Hills Silhouette
        ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(186, 230, 253, 0.5)';
        for(let i=0; i<8; i++) {
            const hillX = ((i * 400 - frameCount.current * 0.5) % (gameWidth + 400) + (gameWidth + 400)) % (gameWidth + 400) - 400;
            ctx.beginPath();
            ctx.arc(hillX * scale, GAME_HEIGHT * scale, 300 * scale, Math.PI, 0);
            ctx.fill();
        }
        
        // Draw Clouds
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)';
        for(let i=0; i<6; i++) {
            const cloudX = ((i * 400 - frameCount.current * 1.5) % (gameWidth + 400) + (gameWidth + 400)) % (gameWidth + 400) - 400;
            const cloudY = 150 + (i * 70) % 300;
            ctx.beginPath();
            ctx.arc(cloudX * scale, cloudY * scale, 60 * scale, 0, Math.PI*2);
            ctx.arc((cloudX + 50) * scale, (cloudY - 30) * scale, 70 * scale, 0, Math.PI*2);
            ctx.arc((cloudX + 100) * scale, cloudY * scale, 60 * scale, 0, Math.PI*2);
            ctx.fill();
        }
    };

    const gameLoop = () => {
        if (!isPlaying || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Make canvas fill its container precisely
        const parent = canvas.parentElement;
        if (parent && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }

        const scale = canvas.height / GAME_HEIGHT;
        const gameWidth = canvas.width / scale;
        const BIRD_X = Math.min(250, gameWidth * 0.2); // Position bird slightly to the left
        const isDark = appearance === 'dark';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Parallax BG
        drawBackground(ctx, canvas, scale, gameWidth, isDark);

        // Draw Score on Board
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        ctx.font = `900 ${250 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(score.toString(), canvas.width / 2, canvas.height * 0.35);

        // Update Bird
        bird.current.velocity += GRAVITY;
        bird.current.y += bird.current.velocity;

        drawBird(ctx, scale, BIRD_X, isDark);

        // Spawn Pipes
        if (frameCount.current % 110 === 0) {
            const minHeight = 100;
            const maxHeight = GAME_HEIGHT - GAP_SIZE - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            pipes.current.push({ x: gameWidth, topHeight, passed: false });
        }

        // Update and Draw Pipes
        pipes.current.forEach((pipe: any) => {
            pipe.x -= PIPE_SPEED;

            drawPipe(ctx, scale, pipe.x, 0, PIPE_WIDTH, pipe.topHeight, true);
            drawPipe(ctx, scale, pipe.x, pipe.topHeight + GAP_SIZE, PIPE_WIDTH, GAME_HEIGHT - pipe.topHeight - GAP_SIZE, false);

            // Score logic
            if (pipe.x + PIPE_WIDTH < BIRD_X && !pipe.passed) {
                pipe.passed = true;
                setScore(s => s + 1);
            }

            // Collision Detection
            const hitTop = BIRD_X + BIRD_RADIUS > pipe.x && 
                           BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH && 
                           bird.current.y - BIRD_RADIUS * 0.8 < pipe.topHeight;
            const hitBottom = BIRD_X + BIRD_RADIUS > pipe.x && 
                              BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH && 
                              bird.current.y + BIRD_RADIUS * 0.8 > pipe.topHeight + GAP_SIZE;

            if (hitTop || hitBottom) {
                gameOver();
            }
        });

        // Floor / Ceiling Collision
        if (bird.current.y + BIRD_RADIUS >= GAME_HEIGHT || bird.current.y - BIRD_RADIUS <= 0) {
            gameOver();
        }

        // Remove off-screen pipes
        if (pipes.current.length > 0 && pipes.current[0].x + PIPE_WIDTH < -200) {
            pipes.current.shift();
        }

        frameCount.current++;
        
        // Save physics state periodically
        if (frameCount.current % 60 === 0) {
            localStorage.setItem('flappy_bird', JSON.stringify(bird.current));
            localStorage.setItem('flappy_pipes', JSON.stringify(pipes.current));
            localStorage.setItem('flappy_frameCount', frameCount.current.toString());
        }

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    };

    const gameOver = () => {
        setIsPlaying(false);
        setIsGameOver(true);
    };

    // Fix closure staleness for score
    useEffect(() => {
        if (isGameOver) {
            updateStats(score);
        }
    }, [isGameOver]);

    // Handle Keyboard & Click
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, isGameOver]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(gameLoop);
        } else if (!isGameOver) {
            // Draw static first frame if not playing
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    const scale = canvasRef.current.height / GAME_HEIGHT;
                    const gameWidth = canvasRef.current.width / scale;
                    const BIRD_X = Math.min(250, gameWidth * 0.2);
                    drawBackground(ctx, canvasRef.current, scale, gameWidth, appearance === 'dark');
                    
                    ctx.fillStyle = appearance === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    ctx.font = `900 ${250 * scale}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(score.toString(), canvasRef.current.width / 2, canvasRef.current.height * 0.35);

                    drawBird(ctx, scale, BIRD_X, appearance === 'dark');
                }
            }
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, appearance, score]);

    // Resize handler to redraw when paused/gameover
    useEffect(() => {
        const handleResize = () => {
            if (!isPlaying && canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                    // Simply trigger a state update to re-render
                    setScore(s => s);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isPlaying]);

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden relative">
                <Head>
                    <title>Flappy Bird - Rewind Nature Games</title>
                </Head>
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
                </div>
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button onClick={toggleTheme} className="p-2.5 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-all hover:rotate-12" aria-label="Toggle theme">
                        {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="relative z-10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(99,102,241,0.1)] border border-slate-200 dark:border-white/10 w-full max-w-md text-center transition-colors duration-300">
                    <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto mx-auto mb-6 drop-shadow-md hover:scale-105 transition-transform" />
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">Flappy Bird</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Enter your name to start playing and save your high scores.</p>
                    <input 
                        type="text" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-5 py-4 rounded-xl bg-white/50 dark:bg-[#0b0f19]/50 border border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all mb-6 text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button onClick={handleSaveName} className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                        Start Playing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center font-sans transition-colors duration-300 relative overflow-hidden selection:bg-indigo-500 selection:text-white ${isFullscreen ? '' : 'py-6 px-4'}`}>
            <Head>
                <title>Flappy Bird - Rewind Nature Games</title>
            </Head>
            
            {!isFullscreen && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
                </div>
            )}

            {!isFullscreen && (
                <header className="relative z-50 w-full max-w-5xl flex justify-between items-center mb-8 bg-white/70 dark:bg-[#0b0f19]/70 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 backdrop-blur-xl">
                    <Link href="/games" className="flex items-center hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto object-contain mr-2 drop-shadow-md transition-transform duration-300 hover:scale-105" />
                    </Link>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2 rounded-full gap-5 shadow-sm backdrop-blur-md">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Player</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm leading-tight">{stats.name}</span>
                            </div>
                            <div className="w-px bg-slate-200 dark:bg-white/10"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Score</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm leading-tight">{score}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Best</span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm leading-tight">{stats.highScore || 0}</span>
                            </div>
                        </div>
                        <button onClick={() => setShowRules(true)} className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm hover:scale-110">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                        <button onClick={toggleFullscreen} className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm hover:scale-110">
                            <Maximize className="w-5 h-5" />
                        </button>
                        <button onClick={toggleTheme} className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm hover:rotate-12">
                            {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </header>
            )}

            <main ref={elementRef} className={`relative z-10 w-full flex flex-col items-center transition-all ${isFullscreen ? 'h-screen w-screen p-0 m-0' : 'max-w-5xl flex-1'}`}>
                
                {isFullscreen && (
                    <>
                        <button 
                            onClick={() => setShowFullscreenInfo(true)}
                            className="absolute top-4 left-4 p-3 rounded-full bg-white/20 dark:bg-black/20 text-white backdrop-blur-md shadow-lg z-50 hover:bg-white/40 transition-all border border-white/20"
                            aria-label="Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={toggleFullscreen}
                            className="absolute top-4 right-4 p-3 rounded-full bg-white/20 dark:bg-black/20 text-white backdrop-blur-md shadow-lg z-50 hover:bg-white/40 transition-all border border-white/20"
                            aria-label="Exit Fullscreen"
                        >
                            <Minimize className="w-6 h-6" />
                        </button>
                    </>
                )}

                <div 
                    className={`relative w-full overflow-hidden shadow-2xl cursor-pointer touch-none bg-gradient-to-b from-sky-300 to-sky-100 dark:from-sky-900 dark:to-slate-900 ${isFullscreen ? 'flex-1 h-full rounded-none border-0' : 'aspect-[16/9] max-w-[1000px] rounded-3xl border-4 border-slate-300 dark:border-white/20'}`}
                    onPointerDown={jump}
                >
                    <canvas 
                        ref={canvasRef}
                        className="w-full h-full block"
                    />

                    {(!isPlaying && !isGameOver) && (
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center backdrop-blur-sm">
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg text-center px-4">
                                Tap to Fly!
                            </h3>
                            <button 
                                onClick={jump}
                                className="px-10 py-5 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-black rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all text-2xl uppercase tracking-wider"
                            >
                                Start Game
                            </button>
                        </div>
                    )}

                    {isGameOver && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
                            <h3 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">CRASH!</h3>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8 flex gap-8">
                                <div className="text-center">
                                    <p className="text-slate-300 font-bold uppercase tracking-widest text-sm mb-1">Score</p>
                                    <p className="text-5xl font-black text-white">{score}</p>
                                </div>
                                <div className="w-px bg-white/20"></div>
                                <div className="text-center">
                                    <p className="text-slate-300 font-bold uppercase tracking-widest text-sm mb-1">Best</p>
                                    <p className="text-5xl font-black text-amber-400">{Math.max(score, stats.highScore || 0)}</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition-all text-2xl flex items-center gap-3 uppercase tracking-wider"
                            >
                                <RotateCcw className="w-7 h-7" /> Play Again
                            </button>
                        </div>
                    )}
                </div>

                {isFullscreen && showFullscreenInfo && (
                    <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl border border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowFullscreenInfo(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-black mb-6 text-center text-slate-800 dark:text-white">Game Menu</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">Score</span>
                                    <span className="font-black text-2xl text-emerald-500">{score}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">Best</span>
                                    <span className="font-black text-2xl text-indigo-500">{Math.max(score, stats.highScore || 0)}</span>
                                </div>
                                <button 
                                    onClick={() => { resetGame(); setShowFullscreenInfo(false); }}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-transform active:scale-95 shadow-lg mt-4"
                                >
                                    <RotateCcw className="w-5 h-5" /> Restart Game
                                </button>
                                <button 
                                    onClick={() => { toggleTheme(); }}
                                    className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors mt-2"
                                >
                                    {appearance === 'dark' ? <><Sun className="w-5 h-5" /> Light Mode</> : <><Moon className="w-5 h-5" /> Dark Mode</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Rules Modal */}
            {showRules && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRules(false)}></div>
                    <div className="relative bg-white dark:bg-[#111827] rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">How to Play</h2>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p><strong>Goal:</strong> Fly as far as you can without hitting the pipes or the ground.</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Press <strong>Spacebar</strong>, <strong>Click</strong>, or <strong>Tap</strong> the game area to jump.</li>
                                <li>Gravity will constantly pull you down, so time your jumps carefully.</li>
                                <li>Each pipe you successfully pass through gives you 1 point.</li>
                                <li>The game ends if you touch a green pipe, the ground, or the ceiling.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
