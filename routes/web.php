<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/games', 'games/Index')->name('games.index');

Route::inertia('/games/nine-mens-morris', 'games/NineMensMorris')->name('games.nine-mens-morris');
Route::inertia('/games/checkers', 'games/Checkers')->name('games.checkers');
Route::inertia('/games/chess', 'games/Chess')->name('games.chess');
Route::inertia('/games/rogue-grid', 'games/RogueGrid')->name('games.rogue-grid');
Route::inertia('/games/flappy-bird', 'games/FlappyBird')->name('games.flappy-bird');
Route::inertia('/games/2048', 'games/Game2048')->name('games.2048');

use App\Http\Controllers\LeaderboardController;
Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard.index');
Route::post('/leaderboard', [LeaderboardController::class, 'store'])->name('leaderboard.store');

Route::redirect('/admin', '/admin/dashboard');

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    require __DIR__.'/settings.php';
});


