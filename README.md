# Rewind Nature Games

Welcome to the **Rewind Nature Games** repository! This is a modern, single-player web-based gaming platform featuring classic and custom games with an elegant, responsive UI.

**🌐 Live Website:** [https://games.rewindnature.in](https://games.rewindnature.in)

## 🎮 Available Games

1. **Checkers** - The classic board game with forced jumps and king promotions.
2. **Chess** - A fully playable single-player chess experience.
3. **9 Kukri (Nine Men's Morris)** - An ancient strategy game featuring placement, movement, and flying phases.
4. **Rogue Grid** - A unique grid-based roguelike puzzle game where you manage health and energy, fight enemies, use potions, and try to reach the exit. Includes customizable mutators to increase difficulty!
5. **Flappy Bird** - The addictive arcade classic! Tap or press space to navigate through the pipes and set a high score.

## ✨ Features

- **Modern UI:** Built using a sleek "glassmorphism" design with animated background orbs and gradients.
- **Dark/Light Mode:** Full support for system-preference dark mode, with a manual toggle in the header.
- **Player Stats tracking:** Keeps track of your wins and losses across your sessions.
- **In-Game Rules:** Every game features a beautifully styled pop-up containing the complete ruleset.
- **Fully Responsive:** Play on desktop, tablet, or mobile devices seamlessly.

## 🛠️ Tech Stack

- **Backend:** Laravel
- **Frontend:** React, Inertia.js, Tailwind CSS (v4)
- **Icons:** Lucide React

## 🚀 Development Setup

If you want to run this project locally:

1. Clone the repository.
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Install Node.js dependencies:
   ```bash
   npm install
   ```
4. Copy the `.env.example` file to `.env` and set up your application key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
5. Start the frontend build process:
   ```bash
   npm run dev
   ```
6. Serve the application using Laravel Herd, Valet, or PHP artisan:
   ```bash
   php artisan serve
   ```

## 👨‍💻 Designed & Developed By

**Rewind Nature Tech**
[https://tech.rewindnature.in/](https://tech.rewindnature.in/)
