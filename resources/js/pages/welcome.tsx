import { Head, Link } from '@inertiajs/react';
import { PlayCircle, Leaf, Trophy, Users, Star, Moon, Sun, Gamepad2, Zap, Shield, Bird } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export default function Welcome() {
    const { appearance, updateAppearance } = useAppearance();
    
    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden">
            <Head>
                <title>Welcome - Rewind Nature Games</title>
                <meta name="description" content="Play classic and modern single-player browser games like Checkers, Chess, Nine Men's Morris, and Rogue Grid with elegant UI and beautiful themes." />
                
                {/* Open Graph / Social Media */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://games.rewindnature.in/" />
                <meta property="og:title" content="Rewind Nature Games - Modern Browser Games" />
                <meta property="og:description" content="Play classic and modern single-player browser games like Checkers, Chess, Nine Men's Morris, and Rogue Grid with elegant UI and beautiful themes." />
                <meta property="og:image" content="https://games.rewindnature.in/logo.png" />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://games.rewindnature.in/" />
                <meta property="twitter:title" content="Rewind Nature Games - Modern Browser Games" />
                <meta property="twitter:description" content="Play classic and modern single-player browser games like Checkers, Chess, Nine Men's Morris, and Rogue Grid." />
                <meta property="twitter:image" content="https://games.rewindnature.in/logo.png" />
            </Head>
            
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-1000"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/20 dark:bg-fuchsia-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[3000ms] delay-700"></div>
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-emerald-500/20 dark:bg-emerald-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[4000ms]"></div>
            </div>

            {/* Header */}
            <header className="relative z-50 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-0 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <img src="/logo.png" alt="Rewind Nature Games" className="h-16 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <nav className="flex items-center gap-4 sm:gap-6 font-medium text-sm">
                        <button 
                            onClick={toggleTheme} 
                            className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all duration-300 hover:rotate-12"
                            aria-label="Toggle theme"
                        >
                            {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link href="/games" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Games</Link>
                        <Link href="/leaderboard" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Leaderboard</Link>
                        <a href="#about" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">About</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-32 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold text-sm mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)] dark:shadow-[0_0_20px_rgba(99,102,241,0.3)] animate-bounce border border-indigo-500/20">
                    <Gamepad2 className="w-4 h-4" /> Next-Gen Classic Gaming
                </span>
                
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 dark:text-white max-w-5xl mx-auto mb-8 leading-[1.05]">
                    Play the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 animate-gradient-x">Classics.</span><br/> Experience the Future.
                </h1>
                
                <p className="text-lg sm:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                    Timeless strategy and puzzle games rebuilt with modern tech, stunning aesthetics, and zero paywalls.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full sm:w-auto">
                    <Link 
                        href="/games"
                        className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(99,102,241,0.4)]"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <PlayCircle className="w-6 h-6 relative z-10 group-hover:animate-ping" /> 
                        <span className="relative z-10">Play Now - Free</span>
                    </Link>
                    <Link 
                        href="#collection"
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-5 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-lg shadow-sm transition-all hover:scale-105"
                    >
                        Explore Games
                    </Link>
                </div>
            </section>

            {/* Featured Section / Collection */}
            <section id="collection" className="relative z-10 py-32 bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border-y border-slate-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Our Game Library</h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                            No downloads. No logins. Just instant, high-quality gameplay.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* 9 Kukri */}
                        <div className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mb-6 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">9 kukri</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 flex-grow font-medium">
                                The ancient Roman classic. Form mills and outsmart your opponent in a game of pure strategy.
                            </p>
                            <Link href="/games/nine-mens-morris" className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold hover:gap-3 transition-all">
                                Launch Game <span className="text-xl">&rarr;</span>
                            </Link>
                        </div>
                        
                        {/* Checkers */}
                        <div className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-6 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Checkers</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 flex-grow font-medium">
                                The classic game of draughts. Jump, capture, and king your pieces to dominate the board.
                            </p>
                            <Link href="/games/checkers" className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-bold hover:gap-3 transition-all">
                                Launch Game <span className="text-xl">&rarr;</span>
                            </Link>
                        </div>
                        
                        {/* Chess */}
                        <div className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Chess</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 flex-grow font-medium">
                                The ultimate game of kings and queens. Command your army to checkmate the opponent.
                            </p>
                            <Link href="/games/chess" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:gap-3 transition-all">
                                Launch Game <span className="text-xl">&rarr;</span>
                            </Link>
                        </div>
                        
                        {/* Rogue Grid */}
                        <div className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <Zap className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Rogue Grid</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 flex-grow font-medium">
                                A customizable dungeon crawler. Manage health and energy to escape the labyrinth!
                            </p>
                            <Link href="/games/rogue-grid" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:gap-3 transition-all">
                                Launch Game <span className="text-xl">&rarr;</span>
                            </Link>
                        </div>
                        
                        {/* Flappy Bird */}
                        <div className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center mb-6 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                                <Bird className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Flappy Bird</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 flex-grow font-medium">
                                How far can you fly? Tap or press space to flap your wings and navigate through the pipes in this addictive arcade classic.
                            </p>
                            <Link href="/games/flappy-bird" className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold hover:gap-3 transition-all">
                                Launch Game <span className="text-xl">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="relative z-10 py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Leaf className="w-16 h-16 text-indigo-500 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    <h2 className="text-4xl sm:text-5xl font-black mb-8">Why Play Here?</h2>
                    <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-20 font-medium">
                        We built a sanctuary for gamers. A place where classics are respected, beautifully presented, and completely free to enjoy without interruptions.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="p-10 bg-white/50 dark:bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg border border-slate-200 dark:border-white/10 hover:scale-105 transition-transform duration-300">
                            <h3 className="text-2xl font-black mb-4 text-indigo-600 dark:text-indigo-400">100% Free</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">No ads, no paywalls, no nonsense. Just pure uninterrupted gameplay.</p>
                        </div>
                        <div className="p-10 bg-white/50 dark:bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg border border-slate-200 dark:border-white/10 hover:scale-105 transition-transform duration-300">
                            <h3 className="text-2xl font-black mb-4 text-fuchsia-600 dark:text-fuchsia-400">No Login Needed</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Jump straight in. Your stats and progress are saved securely to your browser.</p>
                        </div>
                        <div className="p-10 bg-white/50 dark:bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg border border-slate-200 dark:border-white/10 hover:scale-105 transition-transform duration-300">
                            <h3 className="text-2xl font-black mb-4 text-emerald-600 dark:text-emerald-400">Fast & Modern</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Built with the latest web technologies for a smooth, app-like experience.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-slate-100 dark:bg-[#06090f] text-slate-500 dark:text-slate-500 py-16 border-t border-slate-200 dark:border-white/5 text-center">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-3 mb-8 opacity-50 hover:opacity-100 transition-opacity">
                        <img src="/logo.png" alt="Rewind Nature" className="h-10 w-auto" />
                        <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Rewind Nature</span>
                    </div>
                    <p className="mb-8 font-medium">&copy; {new Date().getFullYear()} Rewind Nature Games. All rights reserved.</p>
                    <div className="flex gap-8 font-semibold">
                        <Link href="/games" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">All Games</Link>
                        <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
