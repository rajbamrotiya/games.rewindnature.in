import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Trophy, ArrowLeft, Gamepad2, Sun, Moon, Calendar } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

interface LeaderboardRecord {
    id: number;
    player_name: string;
    game_id: string;
    wins: number;
    losses: number;
    high_score: number;
    last_played_at: string;
}

interface Props {
    leaderboards: LeaderboardRecord[];
    currentGame: string | null;
    currentPeriod: string;
}

const GAMES = [
    { id: 'checkers', name: 'Checkers' },
    { id: 'chess', name: 'Chess' },
    { id: 'nine-mens-morris', name: 'Nine Men\'s Morris' },
    { id: 'rogue-grid', name: 'Rogue Grid' },
    { id: 'flappy-bird', name: 'Flappy Bird' },
    { id: '2048', name: '2048' },
];

const PERIODS = [
    { id: 'daily', name: 'Today' },
    { id: 'weekly', name: 'This Week' },
    { id: 'monthly', name: 'This Month' },
    { id: 'yearly', name: 'This Year' },
    { id: 'all_time', name: 'All Time' },
];

export default function Leaderboard({ leaderboards, currentGame, currentPeriod }: Props) {
    const { appearance, updateAppearance } = useAppearance();
    
    // Fallback if currentPeriod is not passed or empty
    const activePeriod = currentPeriod || 'all_time';

    const getUrl = (game: string | null, period: string) => {
        const params = new URLSearchParams();
        if (game) params.set('game', game);
        if (period !== 'all_time') params.set('period', period);
        const q = params.toString();
        return `/leaderboard${q ? `?${q}` : ''}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white pb-20 relative">
            <Head title="Leaderboard - Rewind Nature Games" />
            
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
            </div>

            {/* Header */}
            <header className="relative z-50 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-0 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                    </Link>
                    <nav className="flex items-center gap-4 sm:gap-6 font-medium text-sm">
                        <button 
                            onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')} 
                            className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all duration-300 hover:rotate-12"
                            aria-label="Toggle theme"
                        >
                            {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link href="/games" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Games</Link>
                        <Link href="/leaderboard" className="text-indigo-600 dark:text-indigo-400 font-bold">Leaderboard</Link>
                    </nav>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 relative z-10">

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl mb-6">
                        <Trophy className="w-10 h-10" />
                    </div>
                    <h1 className="text-5xl font-black mb-4">Hall of Fame</h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                        See who rules the leaderboards across all our games.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
                    {/* Period Filter */}
                    <div className="flex bg-white/50 dark:bg-black/20 backdrop-blur-md p-1 rounded-full border border-slate-200 dark:border-white/10 shadow-sm overflow-x-auto max-w-full hide-scrollbar">
                        {PERIODS.map(period => (
                            <Link 
                                key={period.id}
                                href={getUrl(currentGame, period.id)}
                                preserveScroll
                                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                                    activePeriod === period.id 
                                    ? 'bg-amber-500 text-white shadow-md' 
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {period.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center mb-12">
                    <Link 
                        href={getUrl(null, activePeriod)}
                        preserveScroll
                        className={`px-6 py-3 rounded-full font-bold transition-all ${
                            !currentGame 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                    >
                        All Games
                    </Link>
                    {GAMES.map(game => (
                        <Link 
                            key={game.id}
                            href={getUrl(game.id, activePeriod)}
                            preserveScroll
                            className={`px-6 py-3 rounded-full font-bold transition-all ${
                                currentGame === game.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                                : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                        >
                            {game.name}
                        </Link>
                    ))}
                </div>

                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/50 dark:bg-white/5">
                                    <th className="py-5 px-6 font-bold text-slate-500 uppercase tracking-wider text-sm">Rank</th>
                                    <th className="py-5 px-6 font-bold text-slate-500 uppercase tracking-wider text-sm">Player</th>
                                    <th className="py-5 px-6 font-bold text-slate-500 uppercase tracking-wider text-sm">Game</th>
                                    <th className="py-5 px-6 font-bold text-slate-500 uppercase tracking-wider text-sm text-right">Score / Wins</th>
                                    <th className="py-5 px-6 font-bold text-slate-500 uppercase tracking-wider text-sm text-right">Losses</th>
                                    <th className="py-5 px-6 font-bold text-slate-500 uppercase tracking-wider text-sm text-right">Date Achieved</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                                {leaderboards.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                                            No scores recorded in this period. Be the first!
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboards.map((lb, idx) => {
                                        const isScoreGame = lb.game_id === 'flappy-bird' || lb.game_id === 'rogue-grid' || lb.game_id === '2048';
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="py-5 px-6">
                                                    {idx < 3 ? (
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                                            idx === 0 ? 'bg-amber-400 text-white' : 
                                                            idx === 1 ? 'bg-slate-300 text-slate-700' : 
                                                            'bg-amber-700 text-white'
                                                        }`}>
                                                            {idx + 1}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500 font-bold ml-3">{idx + 1}</span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-6 font-bold text-lg">{lb.player_name}</td>
                                                <td className="py-5 px-6 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                                    {GAMES.find(g => g.id === lb.game_id)?.name || lb.game_id}
                                                </td>
                                                <td className="py-5 px-6 text-right font-black text-indigo-600 dark:text-indigo-400">
                                                    {isScoreGame ? lb.high_score.toLocaleString() : lb.wins}
                                                </td>
                                                <td className="py-5 px-6 text-right font-medium text-slate-500">
                                                    {isScoreGame ? '-' : lb.losses}
                                                </td>
                                                <td className="py-5 px-6 text-right text-slate-500 dark:text-slate-400 text-sm font-medium whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Calendar className="w-4 h-4 opacity-50" />
                                                        {formatDate(lb.last_played_at)}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 mt-32 bg-slate-100 dark:bg-[#06090f] text-slate-500 dark:text-slate-500 py-16 border-t border-slate-200 dark:border-white/5 text-center">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-3 mb-8 opacity-50 hover:opacity-100 transition-opacity">
                        <img src="/logo.png" alt="Rewind Nature" className="h-10 w-auto" />
                        <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Rewind Nature</span>
                    </div>
                    <p className="mb-8 font-medium">&copy; {new Date().getFullYear()} Rewind Nature Games. All rights reserved.</p>
                    <div className="flex gap-8 font-semibold">
                        <Link href="/games" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">All Games</Link>
                        <Link href="/leaderboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Leaderboard</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
