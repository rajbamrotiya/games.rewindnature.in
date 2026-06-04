import { Code2 } from 'lucide-react';

export default function FloatingBranding() {
    return (
        <a 
            href="https://tech.rewindnature.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-4 right-4 z-[100] group flex items-center bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-1.5 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 overflow-hidden"
        >
            <div className="bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white p-2.5 rounded-full shadow-inner flex-shrink-0 group-hover:rotate-12 transition-transform duration-300">
                <Code2 className="w-5 h-5" />
            </div>
            <span className="w-0 overflow-hidden whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:w-[190px] group-hover:px-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                Developed by <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">Rewind Nature Tech</span>
            </span>
        </a>
    );
}
