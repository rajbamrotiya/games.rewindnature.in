import { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, HelpCircle, X, ArrowLeft, Maximize, Minimize, Menu } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { submitScore } from '@/lib/leaderboard';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { Chess as ChessGame, Move, Square } from 'chess.js';

interface GameStats {
    name: string;
    wins: number;
    losses: number;
}

export default function Chess() {
    const { appearance, updateAppearance } = useAppearance();
    const toggleTheme = () => updateAppearance(appearance === 'dark' ? 'light' : 'dark');

    const [stats, setStats] = useState<GameStats | null>(null);
    const [nameInput, setNameInput] = useState('');
    
    // Game State
    const [game, setGame] = useState(new ChessGame());
    const [board, setBoard] = useState(game.board());
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
    const [gameOver, setGameOver] = useState<'w' | 'b' | 'draw' | null>(null);
    const [message, setMessage] = useState('Welcome! You play as White.');
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
        const savedStats = getCookie('chess_stats');
        if (savedStats) {
            try { setStats(JSON.parse(savedStats)); } catch (e) {}
        }
    }, []);

    const handleSaveName = () => {
        if (!nameInput.trim()) return;
        const newStats = { name: nameInput.trim(), wins: 0, losses: 0 };
        setStats(newStats);
        setCookie('chess_stats', JSON.stringify(newStats), 365);
    };

    const updateStats = (winner: 'w' | 'b' | 'draw') => {
        if (stats) {
            const newStats = {
                ...stats,
                wins: winner === 'w' ? stats.wins + 1 : stats.wins,
                losses: winner === 'b' ? stats.losses + 1 : stats.losses
            };
            setStats(newStats);
            setCookie('chess_stats', JSON.stringify(newStats), 365);
            
            if (winner === 'w') submitScore('chess', stats.name, { win: true });
            else if (winner === 'b') submitScore('chess', stats.name, { loss: true });
        }
    };

    const makeAIMove = useCallback(() => {
        if (game.isGameOver()) return;

        setTimeout(() => {
            const moves = game.moves({ verbose: true });
            if (moves.length === 0) return;

            // Simple random AI
            const move = moves[Math.floor(Math.random() * moves.length)];
            game.move(move);
            
            setBoard(game.board());
            
            if (game.isCheckmate()) {
                setGameOver('b');
                setMessage('Checkmate! Black wins.');
                updateStats('b');
            } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
                setGameOver('draw');
                setMessage('Game Over - Draw');
                updateStats('draw');
            } else if (game.isCheck()) {
                setMessage('Check!');
            } else {
                setMessage('Your turn (White)');
            }
        }, 500);
    }, [game]);

    const handleSquareClick = (square: Square) => {
        if (gameOver || game.turn() === 'b') return;

        // If clicking on one of our own pieces, select it
        const piece = game.get(square);
        if (piece && piece.color === 'w') {
            setSelectedSquare(square);
            setPossibleMoves(game.moves({ square, verbose: true }));
            setMessage("Piece selected.");
            return;
        }

        // If a piece is already selected, try to move it to the clicked square
        if (selectedSquare) {
            const move = possibleMoves.find(m => m.to === square);
            
            if (move) {
                try {
                    game.move({
                        from: selectedSquare,
                        to: square,
                        promotion: 'q' // Always promote to queen for simplicity
                    });
                    
                    setBoard(game.board());
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                    
                    if (game.isCheckmate()) {
                        setGameOver('w');
                        setMessage('Checkmate! You win.');
                        updateStats('w');
                    } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
                        setGameOver('draw');
                        setMessage('Game Over - Draw');
                        updateStats('draw');
                    } else {
                        setMessage("Black's turn...");
                        makeAIMove();
                    }
                } catch (e) {
                    setMessage("Invalid move.");
                }
            } else {
                setSelectedSquare(null);
                setPossibleMoves([]);
                setMessage("Move cancelled.");
            }
        }
    };

    const resetGame = () => {
        const newGame = new ChessGame();
        setGame(newGame);
        setBoard(newGame.board());
        setSelectedSquare(null);
        setPossibleMoves([]);
        setGameOver(null);
        setMessage('Welcome! You play as White.');
    };

    const getPieceSymbol = (piece: { type: string, color: string } | null) => {
        if (!piece) return null;
        const symbols: Record<string, Record<string, string>> = {
            'w': { 'p': '♙\uFE0E', 'n': '♘\uFE0E', 'b': '♗\uFE0E', 'r': '♖\uFE0E', 'q': '♕\uFE0E', 'k': '♔\uFE0E' },
            'b': { 'p': '♟\uFE0E', 'n': '♞\uFE0E', 'b': '♝\uFE0E', 'r': '♜\uFE0E', 'q': '♛\uFE0E', 'k': '♚\uFE0E' }
        };
        return symbols[piece.color][piece.type];
    };

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden relative">
                <Head>
                    <title>Chess - Rewind Nature Games</title>
                    <meta name="description" content="Play Chess online. Challenge yourself with a modern single-player chess experience." />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://games.rewindnature.in/games/chess" />
                    <meta property="og:title" content="Chess - Rewind Nature Games" />
                    <meta property="og:description" content="Play Chess online. Challenge yourself with a modern single-player chess experience." />
                    <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content="https://games.rewindnature.in/games/chess" />
                    <meta property="twitter:title" content="Chess - Rewind Nature Games" />
                    <meta property="twitter:description" content="Play Chess online. Challenge yourself with a modern single-player chess experience." />
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
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">Chess</h1>
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
                <title>Chess - Rewind Nature Games</title>
                <meta name="description" content="Play Chess online. Challenge yourself with a modern single-player chess experience." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://games.rewindnature.in/games/chess" />
                <meta property="og:title" content="Chess - Rewind Nature Games" />
                <meta property="og:description" content="Play Chess online. Challenge yourself with a modern single-player chess experience." />
                <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://games.rewindnature.in/games/chess" />
                <meta property="twitter:title" content="Chess - Rewind Nature Games" />
                <meta property="twitter:description" content="Play Chess online. Challenge yourself with a modern single-player chess experience." />
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
                    <div className="w-full h-full grid grid-cols-8 grid-rows-8 border-4 border-[#3e512c] dark:border-[#a0cc77] aspect-square">
                        {board.map((row, rIndex) => (
                            row.map((cell, cIndex) => {
                                const isDark = (rIndex + cIndex) % 2 === 1;
                                
                                // chess.js coordinates: a8 is [0][0], h1 is [7][7]
                                const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                                const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
                                const square = (files[cIndex] + ranks[rIndex]) as Square;
                                
                                const isSelected = selectedSquare === square;
                                const isPossibleMove = possibleMoves.some(m => m.to === square);
                                
                                return (
                                    <div 
                                        key={square}
                                        onClick={() => handleSquareClick(square)}
                                        className={`w-full h-full relative flex items-center justify-center
                                            ${isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'}
                                            ${isPossibleMove ? 'cursor-pointer' : ''}
                                        `}
                                    >
                                        {/* Highlight possible move */}
                                        {isPossibleMove && (
                                            <div className="absolute inset-0 m-auto w-4 h-4 bg-black/20 rounded-full"></div>
                                        )}
                                        
                                        {/* Highlight selected square */}
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-yellow-400/50"></div>
                                        )}
                                        
                                        {/* Piece */}
                                        {cell && (
                                            <div className={`text-4xl md:text-5xl cursor-pointer ${
                                                cell.color === 'w' 
                                                    ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' 
                                                    : 'text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]'
                                            }`}>
                                                {getPieceSymbol(cell)}
                                            </div>
                                        )}

                                        {/* Board coordinates (optional visual flair) */}
                                        {cIndex === 0 && (
                                            <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>
                                                {ranks[rIndex]}
                                            </span>
                                        )}
                                        {rIndex === 7 && (
                                            <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>
                                                {files[cIndex]}
                                            </span>
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
                                game.turn() === 'w'
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20' 
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                            }`}>
                                <p className="font-medium text-lg text-center">{message}</p>
                            </div>
                            
                            {gameOver && (
                                <button 
                                    onClick={resetGame}
                                    className="w-full py-3 bg-[#3e512c] text-white font-semibold rounded-xl hover:bg-[#2d3b20] dark:bg-[#4a6036] dark:hover:bg-[#5d7a42] transition-colors shadow-md"
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
                                    game.turn() === 'w'
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20' 
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
                                    className="w-full bg-[#3e512c] hover:bg-[#2d3b20] text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-transform active:scale-95 shadow-lg mt-4"
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
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Chess Rules</h2>
                            <button onClick={() => setShowRules(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm md:text-base">
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">The Objective</h3>
                            <p>The goal of chess is to checkmate your opponent's king. Checkmate happens when the king is in a position to be captured (in "check") and cannot escape from capture.</p>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Piece Movement</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>King (♔/♚)</strong>: Moves exactly one square in any direction.</li>
                                <li><strong>Queen (♕/♛)</strong>: Moves any number of vacant squares in any direction (horizontally, vertically, or diagonally).</li>
                                <li><strong>Rook (♖/♜)</strong>: Moves any number of vacant squares vertically or horizontally.</li>
                                <li><strong>Bishop (♗/♝)</strong>: Moves any number of vacant squares diagonally.</li>
                                <li><strong>Knight (♘/♞)</strong>: Moves in an 'L' shape: two squares vertically and one horizontally, or two horizontally and one vertically. Knights can jump over other pieces.</li>
                                <li><strong>Pawn (♙/♟)</strong>: Moves forward one square, but captures diagonally forward. On its first move, it can move forward two squares.</li>
                            </ul>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Special Rules</h3>
                            <p><strong>Castling</strong>: A move involving the king and rook that helps protect the king.</p>
                            <p><strong>En Passant</strong>: A special pawn capture that can occur immediately after a pawn makes a two-square advance.</p>
                            <p><strong>Promotion</strong>: When a pawn reaches the opposite end of the board, it is promoted to any other piece (usually a Queen). In this game, pawns automatically promote to Queens.</p>
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
