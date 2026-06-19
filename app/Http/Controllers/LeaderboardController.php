<?php

namespace App\Http\Controllers;

use App\Models\Leaderboard;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    /**
     * Display the leaderboards for a specific game or all games.
     */
    public function index(Request $request)
    {
        $gameId = $request->query('game');
        $period = $request->query('period', 'all_time');

        $query = Leaderboard::query();
        
        if ($gameId) {
            $query->where('game_id', $gameId);
        }

        if ($period === 'daily') {
            $query->whereDate('created_at', today());
        } elseif ($period === 'weekly') {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($period === 'monthly') {
            $query->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
        } elseif ($period === 'yearly') {
            $query->whereYear('created_at', now()->year);
        }

        $leaderboards = $query->selectRaw('player_name, game_id, SUM(wins) as wins, SUM(losses) as losses, MAX(high_score) as high_score, MAX(created_at) as last_played_at')
            ->groupBy('player_name', 'game_id')
            ->orderByRaw('MAX(high_score) DESC')
            ->orderByRaw('SUM(wins) DESC')
            ->limit(100)
            ->get();

        return Inertia::render('leaderboard/Index', [
            'leaderboards' => $leaderboards,
            'currentGame' => $gameId,
            'currentPeriod' => $period
        ]);
    }

    /**
     * API Endpoint to store or update score.
     */
    public function store(Request $request)
    {
        $request->validate([
            'player_name' => 'required|string|max:255',
            'game_id' => 'required|string|max:50',
            'win' => 'nullable|boolean',
            'loss' => 'nullable|boolean',
            'score' => 'nullable|integer',
        ]);

        $record = new Leaderboard();
        $record->player_name = $request->player_name;
        $record->game_id = $request->game_id;
        
        if ($request->has('win') && $request->win) {
            $record->wins = 1;
        }

        if ($request->has('loss') && $request->loss) {
            $record->losses = 1;
        }

        if ($request->has('score')) {
            $record->high_score = $request->score;
        }

        $record->save();

        return response()->json(['success' => true, 'data' => $record]);
    }
}
