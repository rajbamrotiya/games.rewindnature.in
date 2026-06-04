import { Head, Link } from '@inertiajs/react';
import { Moon, Sun, Trophy, Users, Shield, Zap } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export default function GamesIndex() {
    const { appearance, updateAppearance } = useAppearance();
    
    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };
    
    const games = [
        {
            id: 'nine-mens-morris',
            title: "9 kukri",
            description: "A classic strategy board game dating back to the Roman Empire. Form 'mills' to capture your opponent's pieces and claim victory.",
            icon: <Trophy className="w-8 h-8" />,
            color: "violet",
            route: "/games/nine-mens-morris",
            isNew: true,
        },
        {
            id: 'checkers',
            title: "Checkers",
            description: "The classic game of draughts. Jump over your opponent's pieces to capture them and reach the other side to be crowned king.",
            icon: <Users className="w-8 h-8" />,
            color: "red",
            route: "/games/checkers",
            isNew: true,
        },
        {
            id: 'chess',
            title: "Chess",
            description: "The ultimate game of kings and queens. Command your army to checkmate the opponent's king.",
            icon: <Shield className="w-8 h-8" />,
            color: "blue",
            route: "/games/chess",
            isNew: true,
        },
        {
            id: 'rogue-grid',
            title: "Rogue Grid",
            description: "A single-player dungeon crawler where you can customize the rules. Manage health and energy to escape!",
            icon: <Zap className="w-8 h-8" />,
            color: "emerald",
            route: "/games/rogue-grid",
            isNew: true,
        }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'violet': return 'from-violet-500 to-fuchsia-500 text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]';
            case 'red': return 'from-red-500 to-orange-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]';
            case 'blue': return 'from-blue-500 to-cyan-500 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]';
            case 'emerald': return 'from-emerald-500 to-teal-500 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]';
            default: return 'from-slate-500 to-slate-400 text-slate-600 bg-slate-100 hover:shadow-lg';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden relative">
            <Head>
                <title>Our Games - Rewind Nature Games</title>
                <meta name="description" content="Explore our collection of single-player browser games including Checkers, Chess, Nine Men's Morris, and Rogue Grid." />
                
                {/* Open Graph / Social Media */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://games.rewindnature.in/games" />
                <meta property="og:title" content="Our Games - Rewind Nature Games" />
                <meta property="og:description" content="Explore our collection of single-player browser games including Checkers, Chess, Nine Men's Morris, and Rogue Grid." />
                <meta property="og:image" content="https://games.rewindnature.in/logo.png" />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://games.rewindnature.in/games" />
                <meta property="twitter:title" content="Our Games - Rewind Nature Games" />
                <meta property="twitter:description" content="Explore our collection of single-player browser games including Checkers, Chess, Nine Men's Morris, and Rogue Grid." />
                <meta property="twitter:image" content="https://games.rewindnature.in/logo.png" />
            </Head>
            
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-1000"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
            </div>
            
            {/* Header */}
            <header className="relative z-50 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-0 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                        {/* Name removed per user request */}
                    </Link>
                    <nav className="flex items-center gap-4 sm:gap-6 font-medium text-sm">
                        <button 
                            onClick={toggleTheme} 
                            className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all duration-300 hover:rotate-12"
                            aria-label="Toggle theme"
                        >
                            {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link href="/" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Home</Link>
                        <Link href="/games" className="text-indigo-600 dark:text-indigo-400 font-bold">Games</Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative z-10 pt-24 pb-16 text-center px-4 sm:px-6 lg:px-8">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500 animate-gradient-x">
                    Explore Our Games
                </h1>
                <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
                    Discover our collection of timeless classics and modern strategic puzzles, rebuilt with modern tech and zero paywalls.
                </p>
            </div>

            {/* Games Grid */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-12">
                    {games.map((game) => {
                        const styleClasses = getColorClasses(game.color).split(' ');
                        const gradient = styleClasses.find(c => c.startsWith('from-')) + ' ' + styleClasses.find(c => c.startsWith('to-'));
                        const textColor = styleClasses.find(c => c.startsWith('text-'));
                        const darkTextColor = styleClasses.find(c => c.startsWith('dark:text-'));
                        const bgColor = styleClasses.find(c => c.startsWith('bg-'));
                        const darkBgColor = styleClasses.find(c => c.startsWith('dark:bg-'));
                        const hoverShadow = styleClasses.find(c => c.startsWith('hover:shadow-'));

                        return (
                            <div key={game.id} className={`group relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden ${hoverShadow}`}>
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                
                                <div className="flex items-start gap-6 mb-8">
                                    <div className={`w-20 h-20 rounded-2xl ${bgColor} ${darkBgColor} flex items-center justify-center shrink-0 ${textColor} ${darkTextColor} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                        {game.icon}
                                    </div>
                                    <div className="flex flex-col justify-center h-20">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{game.title}</h3>
                                        {game.isNew && (
                                            <span className={`text-sm font-bold uppercase tracking-widest mt-1 ${textColor} ${darkTextColor}`}>
                                                New Release
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 flex-grow leading-relaxed font-medium">
                                    {game.description}
                                </p>

                                <Link 
                                    href={game.route}
                                    className={`inline-flex items-center justify-center w-full py-4 px-8 rounded-xl font-bold text-lg transition-all text-white bg-gradient-to-r ${gradient} hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
                                >
                                    Play Now
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 bg-slate-100 dark:bg-[#06090f] py-12 text-center text-slate-500 border-t border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
                    <img src="/logo.png" alt="Logo" className="h-10 w-auto mb-6 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
                    <p className="font-medium">&copy; {new Date().getFullYear()} Rewind Nature Games. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
