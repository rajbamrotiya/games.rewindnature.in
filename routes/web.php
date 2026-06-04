<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/games', 'games/Index')->name('games.index');

Route::inertia('/games/nine-mens-morris', 'games/NineMensMorris')->name('games.nine-mens-morris');
Route::inertia('/games/checkers', 'games/Checkers')->name('games.checkers');
Route::inertia('/games/chess', 'games/Chess')->name('games.chess');
Route::inertia('/games/rogue-grid', 'games/RogueGrid')->name('games.rogue-grid');

Route::redirect('/admin', '/admin/dashboard');

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    require __DIR__.'/settings.php';
});


