import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, HelpCircle, X } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

// Mill definitions
const MILLS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11],
    [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
    [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7],
    [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23]
];

const ADJACENCY = {
    0: [1, 9], 1: [0, 2, 4], 2: [1, 14],
    3: [4, 10], 4: [1, 3, 5, 7], 5: [4, 13],
    6: [7, 11], 7: [4, 6, 8], 8: [7, 12],
    9: [0, 10, 21], 10: [3, 9, 11, 18], 11: [6, 10, 15],
    12: [8, 13, 17], 13: [5, 12, 14, 20], 14: [2, 13, 23],
    15: [11, 16], 16: [15, 17, 19], 17: [12, 16],
    18: [10, 19], 19: [16, 18, 20, 22], 20: [13, 19],
    21: [9, 22], 22: [19, 21, 23], 23: [14, 22]
} as Record<number, number[]>;

const POSITIONS = {
    0: { top: '0%', left: '0%' }, 1: { top: '0%', left: '50%' }, 2: { top: '0%', left: '100%' },
    3: { top: '16.6%', left: '16.6%' }, 4: { top: '16.6%', left: '50%' }, 5: { top: '16.6%', left: '83.3%' },
    6: { top: '33.3%', left: '33.3%' }, 7: { top: '33.3%', left: '50%' }, 8: { top: '33.3%', left: '66.6%' },
    9: { top: '50%', left: '0%' }, 10: { top: '50%', left: '16.6%' }, 11: { top: '50%', left: '33.3%' },
    12: { top: '50%', left: '66.6%' }, 13: { top: '50%', left: '83.3%' }, 14: { top: '50%', left: '100%' },
    15: { top: '66.6%', left: '33.3%' }, 16: { top: '66.6%', left: '50%' }, 17: { top: '66.6%', left: '66.6%' },
    18: { top: '83.3%', left: '16.6%' }, 19: { top: '83.3%', left: '50%' }, 20: { top: '83.3%', left: '83.3%' },
    21: { top: '100%', left: '0%' }, 22: { top: '100%', left: '50%' }, 23: { top: '100%', left: '100%' }
};

type PlayerType = 'PLAYER' | 'AI' | null;

interface GameStats {
    name: string;
    wins: number;
    losses: number;
}

export default function NineMensMorris() {
    const { appearance, updateAppearance } = useAppearance();
    
    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    const [stats, setStats] = useState<GameStats | null>(null);
    const [nameInput, setNameInput] = useState('');
    
    // Game State
    const [board, setBoard] = useState<PlayerType[]>(Array(24).fill(null));
    const [turn, setTurn] = useState<'PLAYER' | 'AI'>('PLAYER');
    const [phase, setPhase] = useState<'PLACEMENT' | 'MOVEMENT'>('PLACEMENT');
    const [unplacedTokens, setUnplacedTokens] = useState({ PLAYER: 9, AI: 9 });
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [gameOver, setGameOver] = useState<'PLAYER' | 'AI' | null>(null);
    const [message, setMessage] = useState('Welcome! You go first.');
    const [showRules, setShowRules] = useState(false);

    // Helper functions for cookies
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };

    const setCookie = (name: string, value: string, days: number) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    };

    useEffect(() => {
        const savedStats = getCookie('nmm_stats');
        if (savedStats) {
            try {
                setStats(JSON.parse(savedStats));
            } catch (e) {
                console.error("Failed to parse cookie");
            }
        }
    }, []);

    const handleSaveName = () => {
        if (!nameInput.trim()) return;
        const newStats = { name: nameInput.trim(), wins: 0, losses: 0 };
        setStats(newStats);
        setCookie('nmm_stats', JSON.stringify(newStats), 365);
    };

    const updateStats = (winner: 'PLAYER' | 'AI') => {
        if (stats) {
            const newStats = {
                ...stats,
                wins: winner === 'PLAYER' ? stats.wins + 1 : stats.wins,
                losses: winner === 'AI' ? stats.losses + 1 : stats.losses
            };
            setStats(newStats);
            setCookie('nmm_stats', JSON.stringify(newStats), 365);
        }
    };

    const countPieces = (b: PlayerType[], p: 'PLAYER' | 'AI') => b.filter(x => x === p).length;

    const getPlayerState = (b: PlayerType[], unplaced: typeof unplacedTokens, p: 'PLAYER' | 'AI') => {
        const piecesOnBoard = countPieces(b, p);
        const piecesToPlace = unplaced[p];
        const isFlying = piecesToPlace === 0 && piecesOnBoard === 3;
        const canMove = isFlying || b.some((val, i) => {
            if (val !== p) return false;
            return ADJACENCY[i].some(adj => b[adj] === null);
        });
        return { piecesOnBoard, piecesToPlace, isFlying, canMove };
    };

    const isPartOfMill = (b: PlayerType[], pos: number, p: 'PLAYER' | 'AI') => {
        if (b[pos] !== p) return false;
        return MILLS.some(mill => mill.includes(pos) && mill.every(m => b[m] === p));
    };

    const formsMill = (b: PlayerType[], pos: number, p: 'PLAYER' | 'AI') => {
        return MILLS.some(mill => mill.includes(pos) && mill.every(m => (m === pos ? p : b[m]) === p));
    };

    const canBeRemoved = (b: PlayerType[], pos: number, opponent: 'PLAYER' | 'AI') => {
        if (b[pos] !== opponent) return false;
        if (!isPartOfMill(b, pos, opponent)) return true;
        // if all opponent pieces are in mills, any can be removed
        return b.every((val, i) => val !== opponent || isPartOfMill(b, i, opponent));
    };

    const checkWinCondition = (b: PlayerType[], unplaced: typeof unplacedTokens) => {
        if (unplaced.PLAYER === 0 && countPieces(b, 'PLAYER') < 3) return 'AI';
        if (unplaced.AI === 0 && countPieces(b, 'AI') < 3) return 'PLAYER';
        
        const playerState = getPlayerState(b, unplaced, 'PLAYER');
        const aiState = getPlayerState(b, unplaced, 'AI');
        
        if (unplaced.PLAYER === 0 && !playerState.canMove) return 'AI';
        if (unplaced.AI === 0 && !aiState.canMove) return 'PLAYER';
        
        return null;
    };

    const aiMakeMove = useCallback((currentBoard: PlayerType[], currentPhase: typeof phase, currentUnplaced: typeof unplacedTokens) => {
        if (gameOver) return;
        
        setTimeout(() => {
            let nextBoard = [...currentBoard];
            let nextUnplaced = { ...currentUnplaced };
            let aiWillRemove = false;

            if (currentPhase === 'PLACEMENT') {
                const emptySpots = currentBoard.map((val, i) => val === null ? i : -1).filter(i => i !== -1);
                
                let target = emptySpots.find(spot => formsMill(currentBoard, spot, 'AI'));
                if (target === undefined) {
                    target = emptySpots.find(spot => formsMill(currentBoard, spot, 'PLAYER'));
                }
                if (target === undefined) {
                    target = emptySpots[Math.floor(Math.random() * emptySpots.length)];
                }

                nextBoard[target] = 'AI';
                nextUnplaced.AI -= 1;
                aiWillRemove = formsMill(currentBoard, target, 'AI');
            } else {
                const aiState = getPlayerState(currentBoard, currentUnplaced, 'AI');
                const myPieces = currentBoard.map((val, i) => val === 'AI' ? i : -1).filter(i => i !== -1);
                
                let possibleMoves: {from: number, to: number}[] = [];
                if (aiState.isFlying) {
                    const emptySpots = currentBoard.map((val, i) => val === null ? i : -1).filter(i => i !== -1);
                    myPieces.forEach(p => {
                        emptySpots.forEach(e => possibleMoves.push({from: p, to: e}));
                    });
                } else {
                    myPieces.forEach(p => {
                        ADJACENCY[p].forEach(adj => {
                            if (currentBoard[adj] === null) possibleMoves.push({from: p, to: adj});
                        });
                    });
                }

                let move = possibleMoves.find(m => {
                    let tempBoard = [...currentBoard];
                    tempBoard[m.from] = null;
                    return formsMill(tempBoard, m.to, 'AI');
                });

                if (!move && possibleMoves.length > 0) {
                    move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                }

                if (move) {
                    nextBoard[move.from] = null;
                    nextBoard[move.to] = 'AI';
                    let tempBoard = [...currentBoard];
                    tempBoard[move.from] = null;
                    aiWillRemove = formsMill(tempBoard, move.to, 'AI');
                }
            }

            if (aiWillRemove) {
                const removablePieces = nextBoard
                    .map((val, i) => (val === 'PLAYER' && canBeRemoved(nextBoard, i, 'PLAYER')) ? i : -1)
                    .filter(i => i !== -1);
                
                if (removablePieces.length > 0) {
                    const targetToRemove = removablePieces[Math.floor(Math.random() * removablePieces.length)];
                    nextBoard[targetToRemove] = null;
                }
            }

            setBoard(nextBoard);
            setUnplacedTokens(nextUnplaced);
            
            const nextPhase = (nextUnplaced.PLAYER === 0 && nextUnplaced.AI === 0) ? 'MOVEMENT' : 'PLACEMENT';
            setPhase(nextPhase);

            const winner = checkWinCondition(nextBoard, nextUnplaced);
            if (winner) {
                setGameOver(winner);
                setMessage(winner === 'PLAYER' ? 'You won!' : 'AI won!');
                updateStats(winner);
            } else {
                setTurn('PLAYER');
                setMessage('Your turn!');
            }
        }, 1000);
    }, [gameOver]);

    const handleNodeClick = (index: number) => {
        if (gameOver || turn !== 'PLAYER') return;

        if (isRemoving) {
            if (board[index] === 'AI' && canBeRemoved(board, index, 'AI')) {
                const newBoard = [...board];
                newBoard[index] = null;
                setBoard(newBoard);
                setIsRemoving(false);
                
                const winner = checkWinCondition(newBoard, unplacedTokens);
                if (winner) {
                    setGameOver(winner);
                    setMessage('You won!');
                    updateStats(winner);
                } else {
                    setTurn('AI');
                    setMessage("AI's turn...");
                    aiMakeMove(newBoard, phase, unplacedTokens);
                }
            } else {
                setMessage("Cannot remove that piece. Choose another.");
            }
            return;
        }

        if (phase === 'PLACEMENT') {
            if (board[index] !== null) return;
            
            const newBoard = [...board];
            newBoard[index] = 'PLAYER';
            const newUnplaced = { ...unplacedTokens, PLAYER: unplacedTokens.PLAYER - 1 };
            
            setBoard(newBoard);
            setUnplacedTokens(newUnplaced);

            if (formsMill(board, index, 'PLAYER')) {
                setIsRemoving(true);
                setMessage("You formed a Mill! Select an opponent's piece to remove.");
                if (newUnplaced.PLAYER === 0 && newUnplaced.AI === 0) {
                    setPhase('MOVEMENT');
                }
            } else {
                if (newUnplaced.PLAYER === 0 && newUnplaced.AI === 0) {
                    setPhase('MOVEMENT');
                }
                setTurn('AI');
                setMessage("AI's turn...");
                aiMakeMove(newBoard, newUnplaced.PLAYER === 0 && newUnplaced.AI === 0 ? 'MOVEMENT' : 'PLACEMENT', newUnplaced);
            }
        } else {
            const pState = getPlayerState(board, unplacedTokens, 'PLAYER');
            
            if (selectedToken === null) {
                if (board[index] === 'PLAYER') {
                    setSelectedToken(index);
                    setMessage("Piece selected. Click an empty adjacent spot to move.");
                }
            } else {
                if (board[index] === 'PLAYER') {
                    setSelectedToken(index);
                    return;
                }
                if (board[index] === null) {
                    const isAdjacent = ADJACENCY[selectedToken].includes(index);
                    if (pState.isFlying || isAdjacent) {
                        const newBoard = [...board];
                        newBoard[selectedToken] = null;
                        newBoard[index] = 'PLAYER';
                        setBoard(newBoard);
                        setSelectedToken(null);
                        
                        let tempBoard = [...board];
                        tempBoard[selectedToken] = null;
                        if (formsMill(tempBoard, index, 'PLAYER')) {
                            setIsRemoving(true);
                            setMessage("You formed a Mill! Select an opponent's piece to remove.");
                        } else {
                            setTurn('AI');
                            setMessage("AI's turn...");
                            aiMakeMove(newBoard, phase, unplacedTokens);
                        }
                    } else {
                        setMessage("Invalid move. Must move to an adjacent empty spot.");
                    }
                }
            }
        }
    };

    const resetGame = () => {
        setBoard(Array(24).fill(null));
        setTurn('PLAYER');
        setPhase('PLACEMENT');
        setUnplacedTokens({ PLAYER: 9, AI: 9 });
        setSelectedToken(null);
        setIsRemoving(false);
        setGameOver(null);
        setMessage('Welcome! You go first.');
    };

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden relative">
                <Head>
                    <title>9 kukri - Rewind Nature Games</title>
                    <meta name="description" content="Play 9 kukri online. Enjoy the ancient strategy game of Nine Men's Morris with a beautiful modern UI." />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://games.rewindnature.in/games/nine-mens-morris" />
                    <meta property="og:title" content="9 kukri - Rewind Nature Games" />
                    <meta property="og:description" content="Play 9 kukri online. Enjoy the ancient strategy game of Nine Men's Morris with a beautiful modern UI." />
                    <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content="https://games.rewindnature.in/games/nine-mens-morris" />
                    <meta property="twitter:title" content="9 kukri - Rewind Nature Games" />
                    <meta property="twitter:description" content="Play 9 kukri online. Enjoy the ancient strategy game of Nine Men's Morris." />
                    <meta property="twitter:image" content="https://games.rewindnature.in/logo.png" />
                </Head>
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
                </div>
                <div className="absolute top-4 right-4 z-50">
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
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">9 kukri</h1>
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
                <title>9 kukri - Rewind Nature Games</title>
                <meta name="description" content="Play 9 kukri online. Enjoy the ancient strategy game of Nine Men's Morris with a beautiful modern UI." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://games.rewindnature.in/games/nine-mens-morris" />
                <meta property="og:title" content="9 kukri - Rewind Nature Games" />
                <meta property="og:description" content="Play 9 kukri online. Enjoy the ancient strategy game of Nine Men's Morris with a beautiful modern UI." />
                <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://games.rewindnature.in/games/nine-mens-morris" />
                <meta property="twitter:title" content="9 kukri - Rewind Nature Games" />
                <meta property="twitter:description" content="Play 9 kukri online. Enjoy the ancient strategy game of Nine Men's Morris." />
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
                        onClick={toggleTheme} 
                        className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm backdrop-blur-md hover:rotate-12"
                        aria-label="Toggle theme"
                    >
                        {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
                <div className="relative aspect-square w-full max-w-[550px] mx-auto bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
                    <div className="absolute inset-0 m-10 lg:m-12">
                        {/* The Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-neutral-300 dark:stroke-neutral-700 transition-colors duration-300" style={{ strokeWidth: '4px' }}>
                            <rect x="0%" y="0%" width="100%" height="100%" fill="none" />
                            <rect x="16.6%" y="16.6%" width="66.6%" height="66.6%" fill="none" />
                            <rect x="33.3%" y="33.3%" width="33.3%" height="33.3%" fill="none" />
                            <line x1="50%" y1="0%" x2="50%" y2="33.3%" />
                            <line x1="50%" y1="66.6%" x2="50%" y2="100%" />
                            <line x1="0%" y1="50%" x2="33.3%" y2="50%" />
                            <line x1="66.6%" y1="50%" x2="100%" y2="50%" />
                        </svg>

                        {/* The Nodes */}
                        {board.map((player, index) => (
                            <button
                                key={index}
                                onClick={() => handleNodeClick(index)}
                                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center transition-all duration-300 z-10 
                                    ${player === null 
                                        ? 'bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-2 border-neutral-300 dark:border-neutral-700 cursor-pointer hover:scale-125 shadow-sm' 
                                        : player === 'PLAYER' 
                                            ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] dark:shadow-[0_0_15px_rgba(244,63,94,0.6)] border-2 border-rose-200 dark:border-rose-400' 
                                            : 'bg-[#3e512c] dark:bg-[#5d7a42] shadow-[0_0_15px_rgba(62,81,44,0.4)] dark:shadow-[0_0_15px_rgba(93,122,66,0.6)] border-2 border-[#a0cc77]'
                                    }
                                    ${selectedToken === index ? 'ring-4 ring-rose-300 dark:ring-white scale-125' : ''}
                                    ${isRemoving && player === 'AI' && canBeRemoved(board, index, 'AI') ? 'animate-pulse ring-4 ring-[#3e512c] dark:ring-[#a0cc77] cursor-pointer' : ''}
                                `}
                                style={{ top: POSITIONS[index].top, left: POSITIONS[index].left }}
                                disabled={gameOver !== null || turn !== 'PLAYER'}
                                aria-label={`Position ${index}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-lg transition-colors duration-300">
                        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Status</h2>
                        <div className={`p-4 rounded-xl mb-4 shadow-inner ${
                            turn === 'PLAYER' 
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20' 
                                : 'bg-[#3e512c]/5 dark:bg-[#5d7a42]/10 text-[#3e512c] dark:text-[#a0cc77] border border-[#3e512c]/20 dark:border-[#5d7a42]/20'
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

                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-lg transition-colors duration-300">
                        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Game Info</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <span className="text-neutral-500 dark:text-neutral-400">Phase</span>
                                <span className="font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm text-neutral-700 dark:text-neutral-300 shadow-sm">
                                    {phase === 'PLACEMENT' ? 'Placement' : 'Movement'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Your Unplaced</span>
                                </div>
                                <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200">{unplacedTokens.PLAYER}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#3e512c] dark:bg-[#5d7a42] shadow-sm"></div>
                                    <span className="text-neutral-500 dark:text-neutral-400">AI Unplaced</span>
                                </div>
                                <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200">{unplacedTokens.AI}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showRules && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 text-left">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">9 kukri Rules</h2>
                            <button onClick={() => setShowRules(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm md:text-base">
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">1. The Placement Phase</h3>
                            <p>The board starts empty. Players take turns placing one of their nine tokens on any empty intersection.</p>
                            <p><strong>Forming a Mill:</strong> Whenever a player lines up three of their tokens in an unbroken horizontal or vertical line, it is called a "Mill".</p>
                            <p><strong>Capturing:</strong> Every time you form a Mill, you immediately remove one of your opponent's tokens from the board. You can target any opponent token, except one that is already part of their own completed Mill (unless all of their tokens are currently in Mills).</p>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">2. The Movement Phase</h3>
                            <p>Once all 18 tokens have been placed, players take turns sliding a single token along the connecting lines to an adjacent empty spot.</p>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">3. The "Flying" Phase</h3>
                            <p>When a player is reduced to exactly three tokens, their pieces are no longer restricted to adjacent spaces. They can "fly" their tokens to any vacant point on the board.</p>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Win / Lose Conditions</h3>
                            <p><strong>Victory:</strong> You win when your opponent is down to only 2 tokens (because it requires at least 3 tokens to make a Mill).</p>
                            <p><strong>Loss:</strong> You lose if you have more pieces but cannot make any legal moves because your opponent has blocked all your paths.</p>
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
