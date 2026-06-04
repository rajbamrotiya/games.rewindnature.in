<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leaderboards', function (Blueprint $table) {
            $table->id();
            $table->string('player_name');
            $table->string('game_id');
            $table->integer('wins')->default(0);
            $table->integer('losses')->default(0);
            $table->integer('high_score')->default(0);
            $table->timestamps();
            
            // Allow only one record per player per game to track cumulative stats
            $table->unique(['player_name', 'game_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboards');
    }
};
