<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        
        {{-- Default SEO Meta Tags --}}
        <meta name="description" content="Rewind Nature Games - Play classic and modern single-player browser games like Checkers, Chess, Nine Men's Morris, and Rogue Grid with elegant UI and beautiful themes.">
        
        {{-- Open Graph / Facebook --}}
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://games.rewindnature.in/">
        <meta property="og:title" content="Rewind Nature Games - Modern Browser Games">
        <meta property="og:description" content="Play classic and modern single-player browser games like Checkers, Chess, Nine Men's Morris, and Rogue Grid.">
        <meta property="og:image" content="https://games.rewindnature.in/logo.png">

        {{-- Twitter --}}
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="https://games.rewindnature.in/">
        <meta property="twitter:title" content="Rewind Nature Games - Modern Browser Games">
        <meta property="twitter:description" content="Play classic and modern single-player browser games like Checkers, Chess, Nine Men's Morris, and Rogue Grid.">
        <meta property="twitter:image" content="https://games.rewindnature.in/logo.png">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.png" type="image/png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
