export async function submitScore(gameId: string, playerName: string, data: { win?: boolean, loss?: boolean, score?: number }) {
    if (!playerName || !gameId) return;

    try {
        await fetch('/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                player_name: playerName,
                game_id: gameId,
                ...data
            })
        });
    } catch (e) {
        console.error('Failed to submit score', e);
    }
}
