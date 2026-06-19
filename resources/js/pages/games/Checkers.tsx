import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, HelpCircle, X, RotateCcw, Maximize, Minimize, Menu } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { submitScore } from '@/lib/leaderboard';
import { useFullscreen } from '@/hooks/use-fullscreen';

type Piece = 'R' | 'B' | 'RK' | 'BK' | null; // R = Player, B = AI, K = King
type BoardState = Piece[][];

interface GameStats {
    name: string;
    wins: number;
    losses: number;
}

interface Position {
    r: number;
    c: number;
}

interface Move {
    from: Position;
    to: Position;
    jumped?: Position; // Position of the piece that was jumped
}

const INITIAL_BOARD: BoardState = [
    [null, 'B', null, 'B', null, 'B', null, 'B'],
    ['B', null, 'B', null, 'B', null, 'B', null],
    [null, 'B', null, 'B', null, 'B', null, 'B'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['R', null, 'R', null, 'R', null, 'R', null],
    [null, 'R', null, 'R', null, 'R', null, 'R'],
    ['R', null, 'R', null, 'R', null, 'R', null],
];

export default function Checkers() {
    const { appearance, updateAppearance } = useAppearance();
    const toggleTheme = () => updateAppearance(appearance === 'dark' ? 'light' : 'dark');

    const [stats, setStats] = useState<GameStats | null>(null);
    const [nameInput, setNameInput] = useState('');
    
    // Game State
    const [board, setBoard] = useState<BoardState>(() => {
        const saved = localStorage.getItem('checkers_board');
        return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(INITIAL_BOARD));
    });
    const [turn, setTurn] = useState<'R' | 'B'>(() => {
        return (localStorage.getItem('checkers_turn') as 'R' | 'B') || 'R';
    });
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [validMoves, setValidMoves] = useState<Move[]>([]);
    const [mustJumpFrom, setMustJumpFrom] = useState<Position | null>(() => {
        const saved = localStorage.getItem('checkers_mustJumpFrom');
        return saved ? JSON.parse(saved) : null;
    });
    const [gameOver, setGameOver] = useState<'R' | 'B' | null>(() => {
        return (localStorage.getItem('checkers_gameOver') as 'R' | 'B') || null;
    });
    const [message, setMessage] = useState(() => {
        return localStorage.getItem('checkers_message') || 'Welcome! You go first (Red).';
    });
    const [lastMove, setLastMove] = useState<{from: Position, to: Position} | null>(() => {
        const saved = localStorage.getItem('checkers_lastMove');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        localStorage.setItem('checkers_board', JSON.stringify(board));
        localStorage.setItem('checkers_turn', turn);
        localStorage.setItem('checkers_mustJumpFrom', JSON.stringify(mustJumpFrom));
        localStorage.setItem('checkers_gameOver', gameOver || '');
        localStorage.setItem('checkers_message', message);
        localStorage.setItem('checkers_lastMove', JSON.stringify(lastMove));
    }, [board, turn, mustJumpFrom, gameOver, message, lastMove]);
    const [showRules, setShowRules] = useState(false);
    const { isFullscreen, toggleFullscreen, elementRef } = useFullscreen<HTMLDivElement>();
    const [showFullscreenInfo, setShowFullscreenInfo] = useState(false);

    useEffect(() => {
        if (!isFullscreen) setShowFullscreenInfo(false);
    }, [isFullscreen]);

    // Cookie helpers
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };
    const setCookie = (name: string, value: string, days: number) => {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value || ""};expires=${d.toUTCString()};path=/`;
    };

    useEffect(() => {
        const savedStats = getCookie('checkers_stats');
        if (savedStats) {
            try { setStats(JSON.parse(savedStats)); } catch (e) {}
        }
    }, []);

    const handleSaveName = () => {
        if (!nameInput.trim()) return;
        const newStats = { name: nameInput.trim(), wins: 0, losses: 0 };
        setStats(newStats);
        setCookie('checkers_stats', JSON.stringify(newStats), 365);
    };

    const updateStats = (winner: 'R' | 'B') => {
        if (stats) {
            const newStats = {
                ...stats,
                wins: winner === 'R' ? stats.wins + 1 : stats.wins,
                losses: winner === 'B' ? stats.losses + 1 : stats.losses
            };
            setStats(newStats);
            setCookie('checkers_stats', JSON.stringify(newStats), 365);

            if (winner === 'R') submitScore('checkers', stats.name, { win: true });
            else if (winner === 'B') submitScore('checkers', stats.name, { loss: true });
        }
    };

    // Logic
    const isPlayerPiece = (p: Piece, player: 'R' | 'B') => p === player || p === `${player}K`;
    
    const getPossibleMoves = (b: BoardState, player: 'R' | 'B', specificPos?: Position): Move[] => {
        const moves: Move[] = [];
        const jumps: Move[] = [];
        
        const checkPos = (r: number, c: number) => {
            if (b[r][c] === null) return;
            if (!isPlayerPiece(b[r][c], player)) return;
            
            const isKing = b[r][c] === `${player}K`;
            const directions = [];
            if (player === 'R' || isKing) directions.push(-1); // Up
            if (player === 'B' || isKing) directions.push(1);  // Down
            
            for (const dr of directions) {
                for (const dc of [-1, 1]) {
                    const nr = r + dr, nc = c + dc;
                    // Simple move
                    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === null) {
                        moves.push({ from: {r, c}, to: {r: nr, c: nc} });
                    }
                    // Jump move
                    const jr = r + dr * 2, jc = c + dc * 2;
                    if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8) {
                        const jumpedPiece = b[nr][nc];
                        if (jumpedPiece !== null && !isPlayerPiece(jumpedPiece, player) && b[jr][jc] === null) {
                            jumps.push({ from: {r, c}, to: {r: jr, c: jc}, jumped: {r: nr, c: nc} });
                        }
                    }
                }
            }
        };

        if (specificPos) {
            checkPos(specificPos.r, specificPos.c);
        } else {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    checkPos(r, c);
                }
            }
        }

        // If specific position was passed (for multi-jump), only return jumps for that piece
        if (specificPos) {
            return jumps.filter(j => j.from.r === specificPos.r && j.from.c === specificPos.c);
        }

        // Mandatory jump rule: if any jump is possible, only jumps are valid
        return jumps.length > 0 ? jumps : moves;
    };

    const checkWinCondition = (b: BoardState) => {
        const rMoves = getPossibleMoves(b, 'R');
        const bMoves = getPossibleMoves(b, 'B');
        if (rMoves.length === 0) return 'B';
        if (bMoves.length === 0) return 'R';
        return null;
    };

    const aiMakeMove = useCallback((currentBoard: BoardState) => {
        if (gameOver) return;
        
        setTimeout(() => {
            let b = JSON.parse(JSON.stringify(currentBoard));
            let currentPos: Position | null = null;
            let moveMade = false;
            let aiMoveInfo: {from: Position, to: Position} | null = null;

            // AI loop for multiple jumps
            while (true) {
                const moves = getPossibleMoves(b, 'B', currentPos || undefined);
                if (moves.length === 0) break;
                
                // Prefer jumps
                const jumps = moves.filter(m => m.jumped);
                const candidates = jumps.length > 0 ? jumps : moves;
                
                // Simple heuristic: pick a random valid move
                const move = candidates[Math.floor(Math.random() * candidates.length)];
                
                // Apply move
                if (!aiMoveInfo) {
                    aiMoveInfo = { from: move.from, to: move.to };
                } else {
                    aiMoveInfo.to = move.to;
                }
                
                b[move.to.r][move.to.c] = b[move.from.r][move.from.c];
                b[move.from.r][move.from.c] = null;
                if (move.jumped) {
                    b[move.jumped.r][move.jumped.c] = null;
                }
                
                // King promotion
                if (move.to.r === 7 && b[move.to.r][move.to.c] === 'B') {
                    b[move.to.r][move.to.c] = 'BK';
                    moveMade = true;
                    break; // End turn on promotion
                }
                
                moveMade = true;
                if (move.jumped) {
                    const furtherJumps = getPossibleMoves(b, 'B', move.to);
                    if (furtherJumps.length > 0) {
                        currentPos = move.to;
                        continue;
                    }
                }
                break;
            }

            if (moveMade) {
                setBoard(b);
                if (aiMoveInfo) setLastMove(aiMoveInfo);
                const winner = checkWinCondition(b);
                if (winner) {
                    setGameOver(winner);
                    setMessage(winner === 'R' ? 'You won!' : 'AI won!');
                    updateStats(winner);
                } else {
                    setTurn('R');
                    setMessage('Your turn!');
                }
            }
        }, 1000);
    }, [gameOver]);

    const handleSquareClick = (r: number, c: number) => {
        if (gameOver || turn !== 'R') return;

        const allValid = getPossibleMoves(board, 'R', mustJumpFrom || undefined);

        // Selection
        if (isPlayerPiece(board[r][c], 'R')) {
            if (mustJumpFrom) {
                if (mustJumpFrom.r === r && mustJumpFrom.c === c) {
                    setSelectedPos({r, c});
                    setValidMoves(allValid.filter(m => m.from.r === r && m.from.c === c));
                } else {
                    setMessage("You must continue jumping with the current piece.");
                }
            } else {
                const movesForPiece = allValid.filter(m => m.from.r === r && m.from.c === c);
                // If there are mandatory jumps, we can only select pieces that can jump
                const hasJumpsOverall = allValid.some(m => m.jumped);
                if (hasJumpsOverall && !movesForPiece.some(m => m.jumped)) {
                    setMessage("Jump is mandatory. Select a piece that can jump.");
                    return;
                }
                setSelectedPos({r, c});
                setValidMoves(movesForPiece);
                setMessage("Piece selected. Choose destination.");
            }
            return;
        }

        // Movement
        if (selectedPos) {
            const move = validMoves.find(m => m.to.r === r && m.to.c === c);
            if (move) {
                const newBoard = JSON.parse(JSON.stringify(board));
                newBoard[r][c] = newBoard[selectedPos.r][selectedPos.c];
                newBoard[selectedPos.r][selectedPos.c] = null;
                if (move.jumped) {
                    newBoard[move.jumped.r][move.jumped.c] = null;
                }

                setLastMove(prev => {
                    if (mustJumpFrom && prev && prev.to.r === selectedPos.r && prev.to.c === selectedPos.c) {
                        return { from: prev.from, to: {r, c} };
                    }
                    return { from: selectedPos, to: {r, c} };
                });

                // King promotion
                let promoted = false;
                if (r === 0 && newBoard[r][c] === 'R') {
                    newBoard[r][c] = 'RK';
                    promoted = true;
                }

                setBoard(newBoard);
                setSelectedPos(null);
                setValidMoves([]);

                // Check for multi-jump
                if (move.jumped && !promoted) {
                    const furtherJumps = getPossibleMoves(newBoard, 'R', {r, c});
                    if (furtherJumps.length > 0) {
                        setMustJumpFrom({r, c});
                        setMessage("You must continue jumping!");
                        return;
                    }
                }

                // End turn
                setMustJumpFrom(null);
                const winner = checkWinCondition(newBoard);
                if (winner) {
                    setGameOver(winner);
                    setMessage(winner === 'R' ? 'You won!' : 'AI won!');
                    updateStats(winner);
                } else {
                    setTurn('B');
                    setMessage("AI's turn...");
                    aiMakeMove(newBoard);
                }
            } else {
                setSelectedPos(null);
                setValidMoves([]);
                setMessage("Invalid move.");
            }
        }
    };

    const resetGame = () => {
        setBoard(JSON.parse(JSON.stringify(INITIAL_BOARD)));
        setTurn('R');
        setSelectedPos(null);
        setValidMoves([]);
        setMustJumpFrom(null);
        setGameOver(null);
        setLastMove(null);
        setMessage('Welcome! You go first (Red).');
        localStorage.removeItem('checkers_board');
        localStorage.removeItem('checkers_turn');
        localStorage.removeItem('checkers_mustJumpFrom');
        localStorage.removeItem('checkers_gameOver');
        localStorage.removeItem('checkers_message');
        localStorage.removeItem('checkers_lastMove');
    };

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden relative">
                <Head>
                    <title>Checkers - Rewind Nature Games</title>
                    <meta name="description" content="Play Checkers online. A modern version of the classic draughts game with beautiful glassmorphism design." />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://games.rewindnature.in/games/checkers" />
                    <meta property="og:title" content="Checkers - Rewind Nature Games" />
                    <meta property="og:description" content="Play Checkers online. A modern version of the classic draughts game with beautiful glassmorphism design." />
                    <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content="https://games.rewindnature.in/games/checkers" />
                    <meta property="twitter:title" content="Checkers - Rewind Nature Games" />
                    <meta property="twitter:description" content="Play Checkers online. A modern version of the classic draughts game." />
                    <meta property="twitter:image" content="https://games.rewindnature.in/logo.png" />
                </Head>
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
                </div>
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button onClick={toggleFullscreen} className="p-3 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-all hover:scale-110" aria-label="Toggle fullscreen">
                        <Maximize className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={toggleTheme} 
                        className="p-3 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-all hover:rotate-12"
                        aria-label="Toggle theme"
                    >
                        {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="relative z-10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(99,102,241,0.1)] border border-slate-200 dark:border-white/10 w-full max-w-md text-center transition-colors duration-300">
                    <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto mx-auto mb-6 drop-shadow-md hover:scale-105 transition-transform" />
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">Checkers</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Enter your name to start playing and save your scores.</p>
                    <input 
                        type="text" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-5 py-4 rounded-xl bg-white/50 dark:bg-[#0b0f19]/50 border border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all mb-6 text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button 
                        onClick={handleSaveName}
                        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    >
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
                <title>Checkers - Rewind Nature Games</title>
                <meta name="description" content="Play Checkers online. A modern version of the classic draughts game with beautiful glassmorphism design." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://games.rewindnature.in/games/checkers" />
                <meta property="og:title" content="Checkers - Rewind Nature Games" />
                <meta property="og:description" content="Play Checkers online. A modern version of the classic draughts game with beautiful glassmorphism design." />
                <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://games.rewindnature.in/games/checkers" />
                <meta property="twitter:title" content="Checkers - Rewind Nature Games" />
                <meta property="twitter:description" content="Play Checkers online. A modern version of the classic draughts game." />
                <meta property="twitter:image" content="https://games.rewindnature.in/logo.png" />
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
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wins</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm leading-tight">{stats.wins}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Losses</span>
                            <span className="font-black text-rose-600 dark:text-rose-500 text-sm leading-tight">{stats.losses}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowRules(true)} 
                        className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm backdrop-blur-md hover:scale-110"
                        aria-label="Rules"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={toggleFullscreen} 
                        className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm backdrop-blur-md hover:scale-110"
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={toggleTheme} 
                        className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm backdrop-blur-md hover:rotate-12"
                        aria-label="Toggle theme"
                    >
                        {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <div ref={elementRef} className={`relative z-10 w-full transition-all ${isFullscreen ? 'flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b0f19] h-screen max-w-full p-4' : 'max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12'}`}>
                
                {isFullscreen && (
                    <>
                        <button 
                            onClick={() => setShowFullscreenInfo(true)}
                            className="absolute top-4 left-4 p-3 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-white backdrop-blur-md shadow-lg z-50 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all"
                            aria-label="Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={toggleFullscreen}
                            className="absolute top-4 right-4 p-3 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-white backdrop-blur-md shadow-lg z-50 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all"
                            aria-label="Exit Fullscreen"
                        >
                            <Minimize className="w-6 h-6" />
                        </button>
                    </>
                )}

                <div className={`w-full mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-lg p-2 shadow-xl border border-neutral-300 dark:border-neutral-700 ${isFullscreen ? 'max-w-[min(90vw,90vh)] aspect-square flex flex-col justify-center' : 'max-w-[550px]'}`}>
                    <div className="w-full h-full grid grid-cols-8 grid-rows-8 border-4 border-[#5d3b24] dark:border-[#3a2212] aspect-square bg-[#debe98]">
                        {board.map((row, rIndex) => (
                            row.map((cell, cIndex) => {
                                const isDark = (rIndex + cIndex) % 2 === 1;
                                const isSelected = selectedPos?.r === rIndex && selectedPos?.c === cIndex;
                                const isValidMove = validMoves.some(m => m.to.r === rIndex && m.to.c === cIndex);
                                const isLastMove = lastMove && (
                                    (lastMove.from.r === rIndex && lastMove.from.c === cIndex) || 
                                    (lastMove.to.r === rIndex && lastMove.to.c === cIndex)
                                );
                                
                                return (
                                    <div 
                                        key={`${rIndex}-${cIndex}`}
                                        onClick={() => isDark && handleSquareClick(rIndex, cIndex)}
                                        className={`w-full h-full relative flex items-center justify-center
                                            ${isDark ? 'bg-[#8b5a2b]' : 'bg-[#debe98]'}
                                            ${isValidMove ? 'cursor-pointer' : ''}
                                            ${isDark && !isValidMove ? 'hover:bg-[#7a4b22] transition-colors' : ''}
                                        `}
                                    >
                                        {isLastMove && (
                                            <div className="absolute inset-0 bg-cyan-400/30 animate-pulse"></div>
                                        )}
                                        {isValidMove && (
                                            <div className="absolute inset-0 bg-[#3e512c]/40 dark:bg-[#a0cc77]/30 animate-pulse"></div>
                                        )}
                                        
                                        {cell && (
                                            <div className={`w-[80%] h-[80%] rounded-full shadow-md border-[3px] flex items-center justify-center z-10 transition-transform
                                                ${isPlayerPiece(cell, 'R') ? 'bg-rose-600 border-rose-800' : 'bg-neutral-800 border-neutral-950'}
                                                ${isSelected ? 'scale-110 ring-4 ring-white/50' : 'hover:scale-105'}
                                                ${mustJumpFrom?.r === rIndex && mustJumpFrom?.c === cIndex ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                                            `}>
                                                <div className={`w-[70%] h-[70%] rounded-full border-2 opacity-50 ${isPlayerPiece(cell, 'R') ? 'border-rose-800' : 'border-neutral-950'}`}></div>
                                                {cell.includes('K') && (
                                                    <div className="absolute text-yellow-400 font-bold text-xl drop-shadow-md">♔</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>

                {!isFullscreen && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-lg transition-colors duration-300">
                            <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Status</h2>
                            <div className={`p-4 rounded-xl mb-4 shadow-inner ${
                                turn === 'R' 
                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20' 
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                            }`}>
                                <p className="font-medium text-lg text-center">{message}</p>
                            </div>
                            
                            {gameOver && (
                                <button 
                                    onClick={resetGame}
                                    className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-md"
                                >
                                    Play Again
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {isFullscreen && showFullscreenInfo && (
                    <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl border border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowFullscreenInfo(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-black mb-6 text-center text-slate-800 dark:text-white">Game Menu</h2>
                            <div className="space-y-4">
                                <div className={`p-4 rounded-xl mb-4 shadow-inner text-center font-medium ${
                                    turn === 'R' 
                                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20' 
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                                }`}>
                                    {message}
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">Wins</span>
                                    <span className="font-black text-2xl text-emerald-500">{stats.wins}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">Losses</span>
                                    <span className="font-black text-2xl text-rose-500">{stats.losses}</span>
                                </div>
                                <button 
                                    onClick={() => { resetGame(); setShowFullscreenInfo(false); }}
                                    className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-transform active:scale-95 shadow-lg mt-4"
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
            </div>

            {showRules && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 text-left">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Checkers Rules</h2>
                            <button onClick={() => setShowRules(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm md:text-base">
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Basic Movement</h3>
                            <p>Pieces only move diagonally forward on the dark squares. The player with the Red pieces (You) moves first.</p>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Capturing</h3>
                            <p>You can capture an opponent's piece by jumping over it diagonally into an empty square immediately beyond it.</p>
                            <p><strong>Mandatory Jumps:</strong> If a jump is possible, you <strong>must</strong> make that jump. If a jump leads to another possible jump with the same piece, you must continue jumping until no more jumps are possible (multi-jump).</p>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Kings</h3>
                            <p>When a piece reaches the farthest row on the opponent's side of the board, it is crowned a "King".</p>
                            <p>Kings can move and jump diagonally both forward and backward, making them very powerful.</p>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Win Conditions</h3>
                            <p>You win the game when your opponent has no pieces left on the board, or they cannot make any legal moves because all their remaining pieces are blocked.</p>
                        </div>
                        <button onClick={() => setShowRules(false)} className="mt-8 w-full py-3 bg-[#3e512c] text-white rounded-xl font-medium hover:bg-[#2d3b20] transition-colors">
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
