<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Leaderboard extends Model
{
    protected $fillable = [
        'player_name',
        'game_id',
        'wins',
        'losses',
        'high_score'
    ];
}
