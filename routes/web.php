<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::redirect('/admin', '/admin/dashboard');

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    require __DIR__.'/settings.php';
});


