import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, RotateCcw, HelpCircle, X } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { submitScore } from '@/lib/leaderboard';
import FullscreenButton from '@/components/FullscreenButton';

type Board = number[][];

interface Stats {
    name: string;
    wins: number;
    losses: number;
    highScore: number;
}

const getEmptyBoard = (): Board => Array(4).fill(null).map(() => Array(4).fill(0));

const addRandomTile = (board: Board): Board => {
    const emptyCells: {r: number, c: number}[] = [];
    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell === 0) emptyCells.push({r, c});
        });
    });
    
    if (emptyCells.length === 0) return board;
    
    const newBoard = board.map(row => [...row]);
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
};

const checkGameOver = (board: Board): boolean => {
    // Check for any empty cell
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) return false;
        }
    }
    // Check for possible merges
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const current = board[r][c];
            if (r < 3 && board[r + 1][c] === current) return false;
            if (c < 3 && board[r][c + 1] === current) return false;
        }
    }
    return true;
};

export default function Game2048() {
    const { appearance, updateAppearance } = useAppearance();
    const toggleTheme = () => updateAppearance(appearance === 'dark' ? 'light' : 'dark');

    const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(getEmptyBoard())));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [showRules, setShowRules] = useState(false);
    
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

    const resetGame = () => {
        setBoard(addRandomTile(addRandomTile(getEmptyBoard())));
        setScore(0);
        setGameOver(false);
    };

    const updateStats = useCallback((finalScore: number) => {
        if (!stats) return;
        const newStats = { ...stats };
        newStats.losses += 1;
        if (finalScore > (stats.highScore || 0)) {
            newStats.highScore = finalScore;
        }
        setStats(newStats);
        localStorage.setItem('rewind_games_stats', JSON.stringify(newStats));
        submitScore('2048', stats.name, { score: finalScore, loss: true });
    }, [stats]);

    useEffect(() => {
        if (gameOver) {
            updateStats(score);
        }
    }, [gameOver, score, updateStats]);

    const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (gameOver || !stats) return;

        setBoard(prevBoard => {
            let newBoard = prevBoard.map(row => [...row]);
            let newScore = score;
            let moved = false;

            const rotateRight = (matrix: Board) => {
                const result = getEmptyBoard();
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        result[c][3 - r] = matrix[r][c];
                    }
                }
                return result;
            };

            const rotateLeft = (matrix: Board) => {
                const result = getEmptyBoard();
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        result[3 - c][r] = matrix[r][c];
                    }
                }
                return result;
            };

            const moveLeft = (matrix: Board) => {
                const result = getEmptyBoard();
                for (let r = 0; r < 4; r++) {
                    let col = 0;
                    for (let c = 0; c < 4; c++) {
                        if (matrix[r][c] !== 0) {
                            result[r][col] = matrix[r][c];
                            col++;
                        }
                    }
                    for (let c = 0; c < 3; c++) {
                        if (result[r][c] !== 0 && result[r][c] === result[r][c + 1]) {
                            result[r][c] *= 2;
                            newScore += result[r][c];
                            result[r][c + 1] = 0;
                        }
                    }
                    col = 0;
                    const finalRow = Array(4).fill(0);
                    for (let c = 0; c < 4; c++) {
                        if (result[r][c] !== 0) {
                            finalRow[col] = result[r][c];
                            col++;
                        }
                    }
                    result[r] = finalRow;
                }
                return result;
            };

            if (direction === 'LEFT') {
                newBoard = moveLeft(newBoard);
            } else if (direction === 'RIGHT') {
                newBoard = rotateRight(rotateRight(newBoard));
                newBoard = moveLeft(newBoard);
                newBoard = rotateLeft(rotateLeft(newBoard));
            } else if (direction === 'UP') {
                newBoard = rotateLeft(newBoard);
                newBoard = moveLeft(newBoard);
                newBoard = rotateRight(newBoard);
            } else if (direction === 'DOWN') {
                newBoard = rotateRight(newBoard);
                newBoard = moveLeft(newBoard);
                newBoard = rotateLeft(newBoard);
            }

            if (JSON.stringify(prevBoard) !== JSON.stringify(newBoard)) {
                moved = true;
                newBoard = addRandomTile(newBoard);
                setScore(newScore);
            }

            if (moved && checkGameOver(newBoard)) {
                setGameOver(true);
            }

            return moved ? newBoard : prevBoard;
        });
    }, [gameOver, score, stats]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                if (e.key === 'ArrowUp') move('UP');
                if (e.key === 'ArrowDown') move('DOWN');
                if (e.key === 'ArrowLeft') move('LEFT');
                if (e.key === 'ArrowRight') move('RIGHT');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    // Touch handlers
    const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const dx = touchEnd.x - touchStart.x;
        const dy = touchEnd.y - touchStart.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) {
                move(dx > 0 ? 'RIGHT' : 'LEFT');
            }
        } else {
            if (Math.abs(dy) > 30) {
                move(dy > 0 ? 'DOWN' : 'UP');
            }
        }
        setTouchStart(null);
    };

    const getTileColor = (val: number) => {
        const colors: Record<number, string> = {
            0: 'bg-slate-200 dark:bg-slate-800/50',
            2: 'bg-slate-100 text-slate-700 font-bold',
            4: 'bg-amber-100 text-amber-800 font-bold',
            8: 'bg-orange-200 text-orange-800 font-bold',
            16: 'bg-orange-400 text-white font-bold',
            32: 'bg-red-400 text-white font-bold',
            64: 'bg-red-500 text-white font-bold',
            128: 'bg-yellow-300 text-yellow-900 font-bold shadow-[0_0_15px_rgba(253,224,71,0.5)]',
            256: 'bg-yellow-400 text-yellow-900 font-bold shadow-[0_0_20px_rgba(250,204,21,0.6)] text-3xl',
            512: 'bg-yellow-500 text-white font-black shadow-[0_0_25px_rgba(234,179,8,0.7)] text-3xl',
            1024: 'bg-yellow-600 text-white font-black shadow-[0_0_30px_rgba(202,138,4,0.8)] text-2xl',
            2048: 'bg-amber-500 text-white font-black shadow-[0_0_40px_rgba(245,158,11,1)] text-2xl scale-105',
        };
        return colors[val] || 'bg-slate-900 text-white font-black text-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]';
    };

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-yellow-500 selection:text-white transition-colors duration-300 overflow-hidden relative">
                <Head>
                    <title>2048 - Rewind Nature Games</title>
                    <meta name="description" content="Play 2048 online. Join the numbers and get to the 2048 tile!" />
                </Head>
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 dark:bg-yellow-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 dark:bg-amber-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
                </div>
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <FullscreenButton />
                    <button onClick={toggleTheme} className="p-2.5 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-all hover:rotate-12" aria-label="Toggle theme">
                        {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="relative z-10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(234,179,8,0.1)] border border-slate-200 dark:border-white/10 w-full max-w-md text-center transition-colors duration-300">
                    <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto mx-auto mb-6 drop-shadow-md hover:scale-105 transition-transform" />
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500">2048</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Enter your name to start playing and save your high scores.</p>
                    <input 
                        type="text" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-5 py-4 rounded-xl bg-white/50 dark:bg-[#0b0f19]/50 border border-slate-200 dark:border-white/10 focus:border-yellow-500 dark:focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all mb-6 text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        maxLength={15}
                    />
                    <button onClick={handleSaveName} disabled={!nameInput.trim()} className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                        Start Playing
                    </button>
                    <div className="mt-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        <Link href="/games" className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">&larr; Return to Games</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center py-6 px-4 font-sans transition-colors duration-300 relative overflow-hidden selection:bg-yellow-500 selection:text-white">
            <Head>
                <title>2048 - Rewind Nature Games</title>
                <meta name="description" content="Play 2048 online. Join the numbers and get to the 2048 tile!" />
            </Head>
            
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 dark:bg-yellow-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 dark:bg-amber-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
            </div>

            <header className="relative z-50 w-full max-w-5xl flex justify-between items-center mb-10 bg-white/70 dark:bg-[#0b0f19]/70 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 backdrop-blur-xl">
                <Link href="/games" className="flex items-center hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto object-contain mr-2 drop-shadow-md transition-transform duration-300 hover:scale-105" />
                </Link>
                
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2 rounded-full flex gap-5 shadow-sm backdrop-blur-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Player</span>
                            <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm leading-tight">{stats.name}</span>
                        </div>
                        <div className="w-px bg-slate-200 dark:bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Score</span>
                            <span className="font-black text-amber-600 dark:text-amber-400 text-sm leading-tight">{score}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Best</span>
                            <span className="font-black text-yellow-600 dark:text-yellow-400 text-sm leading-tight">{Math.max(score, stats.highScore || 0)}</span>
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
                <div className="w-full max-w-md flex justify-between items-center mb-6 text-sm font-medium">
                    <p className="text-slate-500 dark:text-slate-400">
                        Join the numbers and get to the <span className="font-bold text-slate-800 dark:text-white">2048 tile!</span>
                    </p>
                    <button 
                        onClick={resetGame}
                        className="bg-yellow-500 hover:bg-yellow-400 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md"
                    >
                        <RotateCcw className="w-4 h-4" />
                        New Game
                    </button>
                </div>

                <div 
                    className="bg-slate-300 dark:bg-slate-700 p-3 rounded-2xl w-full max-w-md relative"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="grid grid-cols-4 gap-3 w-full">
                        {board.map((row, r) => (
                            row.map((cell, c) => (
                                <div 
                                    key={`${r}-${c}`} 
                                    className={`rounded-xl flex justify-center items-center text-2xl sm:text-3xl transition-all duration-150 aspect-square ${getTileColor(cell)}`}
                                >
                                    {cell !== 0 ? cell : ''}
                                </div>
                            ))
                        ))}
                    </div>

                    {gameOver && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 drop-shadow-md">Game Over!</h2>
                            <p className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-6">Score: {score}</p>
                            <button 
                                onClick={resetGame}
                                className="bg-yellow-500 hover:bg-yellow-400 text-white px-8 py-3 rounded-xl font-black text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/40"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Rules Modal */}
            {showRules && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full relative shadow-2xl border border-slate-200 dark:border-slate-800">
                        <button 
                            onClick={() => setShowRules(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-black mb-4">How to Play 2048</h3>
                        <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">1</div>
                                <p>Use your arrow keys (or swipe on mobile) to move all tiles on the board.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">2</div>
                                <p>When two tiles with the same number touch, they merge into one!</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">3</div>
                                <p>Every turn, a new 2 or 4 tile will appear randomly on an empty spot.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">4</div>
                                <p>Keep merging tiles to free up space. The game ends when the board fills up and no more moves are possible.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
