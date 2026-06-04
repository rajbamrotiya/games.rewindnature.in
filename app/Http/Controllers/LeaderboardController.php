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

        $query = Leaderboard::query();
        if ($gameId) {
            $query->where('game_id', $gameId);
        }

        // We can sort by either wins or high_score, let's sort by high_score desc, then wins desc
        $leaderboards = $query->orderBy('high_score', 'desc')
                              ->orderBy('wins', 'desc')
                              ->limit(100)
                              ->get();

        return Inertia::render('leaderboard/Index', [
            'leaderboards' => $leaderboards,
            'currentGame' => $gameId
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

        $record = Leaderboard::firstOrNew([
            'player_name' => $request->player_name,
            'game_id' => $request->game_id,
        ]);

        if ($request->has('win') && $request->win) {
            $record->wins += 1;
        }

        if ($request->has('loss') && $request->loss) {
            $record->losses += 1;
        }

        if ($request->has('score')) {
            $record->high_score = max($record->high_score, $request->score);
        }

        $record->save();

        return response()->json(['success' => true, 'data' => $record]);
    }
}
