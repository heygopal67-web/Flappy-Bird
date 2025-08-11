# Flappy Runner

A small browser game where you jump over obstacles and try to survive as long as possible. Built with plain HTML, CSS and JavaScript. No build step is required.

## Features

- Clean, modern UI with start, pause and game‑over screens
- Keyboard and touch controls
- Background music with a simple mute/unmute button
- High score is saved in localStorage
- Night mode fades in after you reach a score of 10
- Obstacles use varied spacing so runs feel less repetitive
- A short on‑screen guide appears for the first 5 seconds of a run
- Mobile friendly layout

## How to play

- Start: click the Start Game button
- Jump: press Space or Arrow Up (tap on touch screens)
- Pause/Resume: press P
- Restart: press R
- Mute/Unmute: click the speaker button in the top left

Goal: avoid hitting obstacles and set a new high score.

## Getting started

1. Download or clone this repository.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
3. Click Start Game. Music will begin after this user interaction.

Tip: If your browser blocks local audio, run a simple local server (for example, VS Code Live Server) and open the page from there.

## Project structure

```
Flappy-Bird/
├── index.html
├── style.css
├── script.js
├── images/
│   ├── background-img.png
│   ├── night.jpg
│   ├── runer.gif            # runner sprite used during gameplay
│   ├── stop.png             # pause state sprite
│   ├── cactus.png  stone.png  stone2.png  wood.png
│   └── favicon.ico
└── sounds effect/
    ├── bgm.mp3
    ├── point.mp3
    └── die.mp3
```

## Customization

You can tweak gameplay quickly in `script.js`:

- `groundTop` and `birdHeightVh`: set the ground line and character height
- `baseObstacleGap` and `obstacleHeight/Width`: spacing and size of obstacles
- `obstacleTypes`: which obstacle images are used
- Night mode threshold: search for `backgroundNight` and change the score check
- Audio volumes: see `loadAudio()`

UI styles live in `style.css`. The start, pause and game‑over cards use the same theme, so small color or radius changes will update all of them.


Enjoy the game and feel free to adjust the settings to match your taste.

thanks guyss enjoy :)
