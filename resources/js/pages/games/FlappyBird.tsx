import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, HelpCircle, X, RotateCcw } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { submitScore } from '@/lib/leaderboard';
import FullscreenButton from '@/components/FullscreenButton';

interface Stats {
    name: string;
    wins: number;
    losses: number;
    highScore: number;
}

const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 60;
const PIPE_SPACING = 200; // Horizontal space between pipes
const GAP_SIZE = 150; // Vertical gap between top and bottom pipe

export default function FlappyBird() {
    const { appearance, updateAppearance } = useAppearance();
    const toggleTheme = () => updateAppearance(appearance === 'dark' ? 'light' : 'dark');

    const [stats, setStats] = useState<Stats | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [showRules, setShowRules] = useState(false);

    // Game state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('Press Space or Tap to Jump!');
    
    // Canvas reference for rendering
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    
    // Game variables (refs to avoid re-renders during loop)
    const bird = useRef({ y: 300, velocity: 0, x: 100, radius: 15 });
    const pipes = useRef<{x: number, topHeight: number, passed: boolean}[]>([]);
    const frameCount = useRef(0);

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
        bird.current = { y: 300, velocity: 0, x: 100, radius: 15 };
        pipes.current = [];
        frameCount.current = 0;
        setScore(0);
        setIsGameOver(false);
        setIsPlaying(true);
        setMessage('');
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

    const gameLoop = () => {
        if (!isPlaying || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update Bird
        bird.current.velocity += GRAVITY;
        bird.current.y += bird.current.velocity;

        // Draw Bird
        ctx.fillStyle = '#facc15'; // Yellow
        ctx.beginPath();
        ctx.arc(bird.current.x, bird.current.y, bird.current.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ca8a04'; // Darker yellow
        ctx.stroke();

        // Draw eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(bird.current.x + 6, bird.current.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Spawn Pipes
        if (frameCount.current % 100 === 0) {
            const minHeight = 50;
            const maxHeight = canvas.height - GAP_SIZE - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            pipes.current.push({ x: canvas.width, topHeight, passed: false });
        }

        // Update and Draw Pipes
        ctx.fillStyle = '#22c55e'; // Green
        pipes.current.forEach((pipe, index) => {
            pipe.x -= PIPE_SPEED;

            // Draw Top Pipe
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            
            // Draw Bottom Pipe
            ctx.fillRect(pipe.x, pipe.topHeight + GAP_SIZE, PIPE_WIDTH, canvas.height - pipe.topHeight - GAP_SIZE);
            ctx.strokeRect(pipe.x, pipe.topHeight + GAP_SIZE, PIPE_WIDTH, canvas.height - pipe.topHeight - GAP_SIZE);

            // Score logic
            if (pipe.x + PIPE_WIDTH < bird.current.x && !pipe.passed) {
                pipe.passed = true;
                setScore(s => s + 1);
            }

            // Collision Detection
            const hitTop = bird.current.x + bird.current.radius > pipe.x && 
                           bird.current.x - bird.current.radius < pipe.x + PIPE_WIDTH && 
                           bird.current.y - bird.current.radius < pipe.topHeight;
            const hitBottom = bird.current.x + bird.current.radius > pipe.x && 
                              bird.current.x - bird.current.radius < pipe.x + PIPE_WIDTH && 
                              bird.current.y + bird.current.radius > pipe.topHeight + GAP_SIZE;

            if (hitTop || hitBottom) {
                gameOver();
            }
        });

        // Floor / Ceiling Collision
        if (bird.current.y + bird.current.radius >= canvas.height || bird.current.y - bird.current.radius <= 0) {
            gameOver();
        }

        // Remove off-screen pipes
        if (pipes.current.length > 0 && pipes.current[0].x + PIPE_WIDTH < 0) {
            pipes.current.shift();
        }

        frameCount.current++;
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    };

    const gameOver = () => {
        setIsPlaying(false);
        setIsGameOver(true);
        updateStats(score); // this creates a stale closure issue if not careful, but score is in state. 
        // Actually, setScore(s => updateStats(s)) might be better or just use state. Wait, score in closure is stale.
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
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying]);

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden relative">
                <Head>
                    <title>Flappy Bird - Rewind Nature Games</title>
                    <meta name="description" content="Play Flappy Bird online. How far can you fly in this classic arcade challenge?" />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://games.rewindnature.in/games/flappy-bird" />
                    <meta property="og:title" content="Flappy Bird - Rewind Nature Games" />
                    <meta property="og:description" content="Play Flappy Bird online. How far can you fly in this classic arcade challenge?" />
                    <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                </Head>
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
                </div>
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <FullscreenButton />
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
                    <div className="mt-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        <Link href="/games" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">&larr; Return to Games</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center py-6 px-4 font-sans transition-colors duration-300 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
            <Head>
                <title>Flappy Bird - Rewind Nature Games</title>
                <meta name="description" content="Play Flappy Bird online. How far can you fly in this classic arcade challenge?" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://games.rewindnature.in/games/flappy-bird" />
                <meta property="og:title" content="Flappy Bird - Rewind Nature Games" />
                <meta property="og:description" content="Play Flappy Bird online. How far can you fly in this classic arcade challenge?" />
                <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
            </Head>
            
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
            </div>

            <header className="relative z-50 w-full max-w-5xl flex justify-between items-center mb-10 bg-white/70 dark:bg-[#0b0f19]/70 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 backdrop-blur-xl">
                <Link href="/games" className="flex items-center hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto object-contain mr-2 drop-shadow-md transition-transform duration-300 hover:scale-105" />
                </Link>
                
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2 rounded-full flex gap-5 shadow-sm backdrop-blur-md">
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
                    <button 
                        onClick={() => setShowRules(true)} 
                        className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm backdrop-blur-md hover:scale-110"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <FullscreenButton />
                    <button 
                        onClick={toggleTheme} 
                        className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm backdrop-blur-md hover:rotate-12"
                    >
                        {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <main className="relative z-10 w-full max-w-4xl flex flex-col items-center flex-1">
                <div className="mb-6 flex justify-between items-center w-full max-w-[800px]">
                    <h2 className="text-2xl font-bold">Flappy Bird</h2>
                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                        {message}
                    </div>
                </div>

                <div 
                    className="relative w-full max-w-[800px] aspect-[4/3] bg-sky-200 dark:bg-sky-950 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-300 dark:border-white/20 cursor-pointer touch-none"
                    onPointerDown={jump}
                >
                    <canvas 
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="w-full h-full block"
                    />

                    {(!isPlaying && !isGameOver) && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                            <button 
                                onClick={jump}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xl"
                            >
                                Start Game
                            </button>
                        </div>
                    )}

                    {isGameOver && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
                            <h3 className="text-5xl font-black text-white mb-2 tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">GAME OVER</h3>
                            <p className="text-2xl text-slate-200 mb-8 font-medium">Score: {score}</p>
                            <button 
                                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition-all text-xl flex items-center gap-3"
                            >
                                <RotateCcw className="w-6 h-6" /> Play Again
                            </button>
                        </div>
                    )}
                </div>
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
