import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, HelpCircle, X, Shield, Zap, Skull, Settings, Trophy, DoorOpen } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { submitScore } from '@/lib/leaderboard';

interface GameStats {
    name: string;
    wins: number;
    losses: number;
}

type EntityType = 'PLAYER' | 'WALL' | 'ENEMY' | 'POTION' | 'EXIT' | null;

interface Position {
    r: number;
    c: number;
}

interface GridCell {
    type: EntityType;
    revealed: boolean;
}

interface Mutator {
    id: string;
    name: string;
    description: string;
}

const MUTATORS: Mutator[] = [
    { id: 'fragile', name: 'Fragile', description: 'Start with only 50 max Health instead of 100.' },
    { id: 'tiring', name: 'Exhaustion', description: 'Moving costs 2 Energy instead of 1.' },
    { id: 'darkness', name: 'Darkness', description: 'You can only see a 1-tile radius around you.' },
    { id: 'maze', name: 'Labyrinth', description: 'Generates twice as many walls.' },
    { id: 'bountiful', name: 'Bountiful', description: 'Double the amount of potions spawn.' },
];

export default function RogueGrid() {
    const { appearance, updateAppearance } = useAppearance();
    const toggleTheme = () => updateAppearance(appearance === 'dark' ? 'light' : 'dark');

    const [stats, setStats] = useState<GameStats | null>(null);
    const [nameInput, setNameInput] = useState('');
    
    // Config State
    const [selectedMutators, setSelectedMutators] = useState<string[]>([]);
    
    // Game State
    const [isPlaying, setIsPlaying] = useState(false);
    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [playerPos, setPlayerPos] = useState<Position>({ r: 0, c: 0 });
    const [health, setHealth] = useState(100);
    const [energy, setEnergy] = useState(100);
    const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null);
    const [message, setMessage] = useState('Select your rules and start the run!');
    const [showRules, setShowRules] = useState(false);

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
        const savedStats = getCookie('rogue_stats');
        if (savedStats) {
            try { setStats(JSON.parse(savedStats)); } catch (e) {}
        }
    }, []);

    const handleSaveName = () => {
        if (!nameInput.trim()) return;
        const newStats = { name: nameInput.trim(), wins: 0, losses: 0 };
        setStats(newStats);
        setCookie('rogue_stats', JSON.stringify(newStats), 365);
    };

    const updateStats = (won: boolean) => {
        if (stats) {
            const newStats = {
                ...stats,
                wins: won ? stats.wins + 1 : stats.wins,
                losses: !won ? stats.losses + 1 : stats.losses
            };
            setStats(newStats);
            setCookie('rogue_stats', JSON.stringify(newStats), 365);

            submitScore('rogue-grid', stats.name, { win: won, loss: !won, score: won ? health + energy : 0 });
        }
    };

    const toggleMutator = (id: string) => {
        setSelectedMutators(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const initGame = () => {
        const size = 10;
        let newGrid: GridCell[][] = Array(size).fill(null).map(() => 
            Array(size).fill(null).map(() => ({ type: null, revealed: true }))
        );

        // Generate Walls
        const numWalls = selectedMutators.includes('maze') ? 40 : 20;
        for(let i=0; i<numWalls; i++) {
            let r = Math.floor(Math.random() * size);
            let c = Math.floor(Math.random() * size);
            if ((r !== 0 || c !== 0) && (r !== size-1 || c !== size-1)) {
                newGrid[r][c].type = 'WALL';
            }
        }

        // Generate Enemies
        for(let i=0; i<15; i++) {
            let r = Math.floor(Math.random() * size);
            let c = Math.floor(Math.random() * size);
            if (newGrid[r][c].type === null && (r !== 0 || c !== 0)) {
                newGrid[r][c].type = 'ENEMY';
            }
        }

        // Generate Potions
        const numPotions = selectedMutators.includes('bountiful') ? 10 : 5;
        for(let i=0; i<numPotions; i++) {
            let r = Math.floor(Math.random() * size);
            let c = Math.floor(Math.random() * size);
            if (newGrid[r][c].type === null && (r !== 0 || c !== 0)) {
                newGrid[r][c].type = 'POTION';
            }
        }

        // Setup Exit
        newGrid[size-1][size-1].type = 'EXIT';
        
        // Setup Player
        newGrid[0][0].type = 'PLAYER';
        setPlayerPos({ r: 0, c: 0 });

        setGrid(newGrid);
        setHealth(selectedMutators.includes('fragile') ? 50 : 100);
        setEnergy(100);
        setGameOver(null);
        setIsPlaying(true);
        setMessage('Reach the door! Watch your energy and health.');
        
        updateVisibility(newGrid, {r: 0, c: 0});
    };

    const updateVisibility = (currentGrid: GridCell[][], pos: Position) => {
        if (!selectedMutators.includes('darkness')) return;
        
        const newGrid = [...currentGrid];
        for(let r=0; r<10; r++) {
            for(let c=0; c<10; c++) {
                newGrid[r][c].revealed = false;
                if (Math.abs(r - pos.r) <= 1 && Math.abs(c - pos.c) <= 1) {
                    newGrid[r][c].revealed = true;
                }
            }
        }
        setGrid(newGrid);
    };

    const handleMove = (r: number, c: number) => {
        if (gameOver || !isPlaying) return;
        
        // Must be adjacent
        const dr = Math.abs(playerPos.r - r);
        const dc = Math.abs(playerPos.c - c);
        if (dr + dc !== 1) return; // Only orthogonal moves

        const target = grid[r][c];
        if (target.type === 'WALL') {
            setMessage("Ouch! You bumped into a wall.");
            return;
        }

        let newHealth = health;
        let newEnergy = energy - (selectedMutators.includes('tiring') ? 2 : 1);
        let msg = "You moved.";

        if (target.type === 'ENEMY') {
            newHealth -= 20;
            msg = "You fought an enemy! Lost 20 Health.";
        } else if (target.type === 'POTION') {
            newHealth = Math.min(selectedMutators.includes('fragile') ? 50 : 100, newHealth + 30);
            newEnergy = Math.min(100, newEnergy + 20);
            msg = "Drank a potion! Restored Health and Energy.";
        } else if (target.type === 'EXIT') {
            setGameOver('win');
            setMessage("You escaped the dungeon!");
            updateStats(true);
            setIsPlaying(false);
            return;
        }

        if (newHealth <= 0 || newEnergy <= 0) {
            setGameOver('lose');
            setMessage(newHealth <= 0 ? "You died from injuries!" : "You collapsed from exhaustion!");
            updateStats(false);
            setIsPlaying(false);
            setHealth(newHealth);
            setEnergy(newEnergy);
            return;
        }

        const newGrid = [...grid];
        newGrid[playerPos.r][playerPos.c].type = null; // Leave current
        newGrid[r][c].type = 'PLAYER'; // Enter new
        
        setHealth(newHealth);
        setEnergy(newEnergy);
        setPlayerPos({ r, c });
        setMessage(msg);
        updateVisibility(newGrid, { r, c });
    };

    const renderCell = (cell: GridCell, r: number, c: number) => {
        if (selectedMutators.includes('darkness') && !cell.revealed) {
            return <div className="w-full h-full bg-neutral-900/90 rounded-sm"></div>;
        }

        switch (cell.type) {
            case 'PLAYER': return <div className="text-2xl md:text-3xl animate-bounce">🧙‍♂️</div>;
            case 'WALL': return <div className="w-full h-full bg-stone-700 dark:bg-stone-600 rounded-sm shadow-inner flex items-center justify-center"><div className="text-stone-900/20 text-xs">🧱</div></div>;
            case 'ENEMY': return <div className="text-xl md:text-2xl drop-shadow-md">💀</div>;
            case 'POTION': return <div className="text-xl md:text-2xl drop-shadow-md animate-pulse">🧪</div>;
            case 'EXIT': return <div className="text-2xl md:text-3xl drop-shadow-md">🚪</div>;
            default: return null;
        }
    };

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden relative">
                <Head>
                    <title>Rogue Grid - Rewind Nature Games</title>
                    <meta name="description" content="Play Rogue Grid online. A single-player grid-based dungeon crawler with customizable rules, mutators, and enemies." />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://games.rewindnature.in/games/rogue-grid" />
                    <meta property="og:title" content="Rogue Grid - Rewind Nature Games" />
                    <meta property="og:description" content="Play Rogue Grid online. A single-player grid-based dungeon crawler with customizable rules, mutators, and enemies." />
                    <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content="https://games.rewindnature.in/games/rogue-grid" />
                    <meta property="twitter:title" content="Rogue Grid - Rewind Nature Games" />
                    <meta property="twitter:description" content="Play Rogue Grid online. A single-player grid-based dungeon crawler with customizable rules, mutators, and enemies." />
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
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">Rogue Grid</h1>
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
                <title>Rogue Grid - Rewind Nature Games</title>
                <meta name="description" content="Play Rogue Grid online. A single-player grid-based dungeon crawler with customizable rules, mutators, and enemies." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://games.rewindnature.in/games/rogue-grid" />
                <meta property="og:title" content="Rogue Grid - Rewind Nature Games" />
                <meta property="og:description" content="Play Rogue Grid online. A single-player grid-based dungeon crawler with customizable rules, mutators, and enemies." />
                <meta property="og:image" content="https://games.rewindnature.in/logo.png" />
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://games.rewindnature.in/games/rogue-grid" />
                <meta property="twitter:title" content="Rogue Grid - Rewind Nature Games" />
                <meta property="twitter:description" content="Play Rogue Grid online. A single-player grid-based dungeon crawler with customizable rules, mutators, and enemies." />
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

            <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {!isPlaying && !gameOver ? (
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <Settings className="text-purple-600 w-6 h-6" />
                                <h2 className="text-2xl font-bold">Select Mutators</h2>
                            </div>
                            <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
                                Customize your run by enabling special rules. Combine them for a unique challenge!
                            </p>
                            
                            <div className="space-y-3 mb-8">
                                {MUTATORS.map(m => (
                                    <label key={m.id} className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        selectedMutators.includes(m.id) 
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' 
                                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                                    }`}>
                                        <input 
                                            type="checkbox" 
                                            className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                            checked={selectedMutators.includes(m.id)}
                                            onChange={() => toggleMutator(m.id)}
                                        />
                                        <div className="ml-3">
                                            <div className="font-semibold text-neutral-900 dark:text-white">{m.name}</div>
                                            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{m.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button onClick={initGame} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                Enter Dungeon
                            </button>
                        </div>
                    ) : (
                        <div className="bg-neutral-800 p-3 rounded-2xl shadow-2xl border-4 border-neutral-900 mx-auto w-full max-w-[500px]">
                            <div className="grid grid-cols-10 grid-rows-10 gap-1 aspect-square">
                                {grid.map((row, rIndex) => (
                                    row.map((cell, cIndex) => {
                                        // Calculate orthogonal adjacency
                                        const dr = Math.abs(playerPos.r - rIndex);
                                        const dc = Math.abs(playerPos.c - cIndex);
                                        const isAdjacent = dr + dc === 1;

                                        return (
                                            <div 
                                                key={`${rIndex}-${cIndex}`}
                                                onClick={() => handleMove(rIndex, cIndex)}
                                                className={`relative w-full h-full rounded flex items-center justify-center transition-colors
                                                    ${cell.revealed !== false ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-neutral-950'}
                                                    ${isAdjacent && isPlaying ? 'cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-600 ring-2 ring-purple-500/30' : ''}
                                                `}
                                            >
                                                {renderCell(cell, rIndex, cIndex)}
                                            </div>
                                        );
                                    })
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Trophy className="text-yellow-500 w-5 h-5" /> Vitals
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-semibold mb-2">
                                    <span className="flex items-center gap-1 text-rose-600"><Shield className="w-4 h-4"/> Health</span>
                                    <span>{health} / {selectedMutators.includes('fragile') ? 50 : 100}</span>
                                </div>
                                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-rose-500 h-full transition-all duration-300"
                                        style={{ width: `${(health / (selectedMutators.includes('fragile') ? 50 : 100)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm font-semibold mb-2">
                                    <span className="flex items-center gap-1 text-amber-500"><Zap className="w-4 h-4"/> Energy</span>
                                    <span>{energy} / 100</span>
                                </div>
                                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-amber-400 h-full transition-all duration-300"
                                        style={{ width: `${energy}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-lg font-bold mb-3">Status</h2>
                        <div className={`p-4 rounded-xl shadow-inner font-medium text-center ${
                            gameOver === 'win' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            gameOver === 'lose' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}>
                            {message}
                        </div>

                        {(gameOver || isPlaying) && (
                            <button 
                                onClick={() => { setIsPlaying(false); setGameOver(null); }}
                                className="mt-4 w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-neutral-800 transition-colors shadow-md flex items-center justify-center gap-2"
                            >
                                <Settings className="w-4 h-4" /> Change Rules / Restart
                            </button>
                        )}
                    </div>
                    
                    {isPlaying && selectedMutators.length > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 p-5 rounded-2xl">
                            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-2 uppercase tracking-wide">Active Mutators</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedMutators.map(m => {
                                    const mutDef = MUTATORS.find(x => x.id === m);
                                    return (
                                        <span key={m} className="px-2.5 py-1 bg-purple-200 dark:bg-purple-800/50 text-purple-900 dark:text-purple-200 text-xs font-semibold rounded-md">
                                            {mutDef?.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showRules && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 text-left">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Rogue Grid Rules</h2>
                            <button onClick={() => setShowRules(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-neutral-900">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm md:text-base">
                            <p>You are an adventurer trapped in a deadly grid dungeon. Your goal is to reach the Exit (🚪).</p>
                            
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Stats</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Health (🛡️):</strong> Reaching 0 means death. Fights cost health.</li>
                                <li><strong>Energy (⚡):</strong> Reaching 0 means exhaustion and death. Moving costs energy.</li>
                            </ul>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Entities</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Player (🧙‍♂️):</strong> That's you.</li>
                                <li><strong>Enemy (💀):</strong> Bumping into them kills them but you lose 20 Health.</li>
                                <li><strong>Potion (🧪):</strong> Restores 30 Health and 20 Energy.</li>
                                <li><strong>Wall (🧱):</strong> Blocks movement.</li>
                            </ul>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mt-4">Mutators</h3>
                            <p>Before starting, you can activate Mutators to change the rules of the grid. Combine them to create incredibly difficult scenarios!</p>
                        </div>
                        <button onClick={() => setShowRules(false)} className="mt-8 w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
