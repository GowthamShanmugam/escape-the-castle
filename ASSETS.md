# Game Assets Attribution

All game assets are CC-licensed (Creative Commons) to comply with Red Hat Arcade requirements.

## Images (Wikimedia Commons — stored locally in `frontend/public/images/`)

All game images are downloaded and stored locally so the game works offline and does not depend on external servers.

| Asset | Local file | Source | License |
|-------|------------|--------|---------|
| Dark Night (Neuschwanstein Castle) | `images/dark-room-bg.jpeg` | [File](https://commons.wikimedia.org/wiki/File:Dark_Night_(210029631).jpeg) — Denis Lintner | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| Dresden Rüstkammer | `images/armory-jigsaw.jpg` | [File](https://commons.wikimedia.org/wiki/File:Dresden,_Rüstkammer_(Dezember_2023).jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Trakai Island Castle Chapel | `images/chapel-chain-rhythm.jpg` | [File](https://commons.wikimedia.org/wiki/File:Trakai_Island_Castle_Chapel,_Lithuania_-_Diliff.jpg) — David Iliff | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Key icon | `images/key-icon.png` | [File](https://commons.wikimedia.org/wiki/File:Key-dynamic-premium.png) — Vijay Verma | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) (Public Domain) |

## Audio

| Asset | Usage | Source | License |
|-------|-------|--------|---------|
| Thunder | Intro thunder flash | [Orange Free Sounds](https://orangefreesounds.com/thunder/) — Alexander | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Rain | Intro rain ambiance | [Orange Free Sounds](https://orangefreesounds.com/sleep-sounds-rain/) — Alexander | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Running | Intro running footsteps (plays first) | [Freesound: Footsteps Running Away Fading](https://freesound.org/people/Rudmer_Rotteveel/sounds/316924/) — Rudmer_Rotteveel | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Guard shout | Intro guard voice (“prisoner escaped—catch him!”) | [Freesound: NPC Guards (Warnings)](https://freesound.org/people/SoundBiterSFX/sounds/732542/) — SoundBiterSFX / VoiceBosch. Trim 28.8s–32.2s → `guard-shout.wav`. | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Guard "you stop" | Guard voice ("you stop") | [Freesound: NPC Guards (Warnings)](https://freesound.org/people/SoundBiterSFX/sounds/732542/) — SoundBiterSFX / VoiceBosch. Trim 1:46.2–1:49.6 → `guard-you-stop.wav`. | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Screaming | Intro (after guard) | [Freesound: Screaming 5.wav](https://freesound.org/people/vtownpunks/sounds/63637/) — vtownpunks | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| Where I am | First level loaded (player "opens eyes") | [Freesound: Voice Request #25 - Where I Am](https://freesound.org/people/InspectorJ/sounds/400909/) — InspectorJ. Trim 23.26s–24.94s → `where-i-am.wav`. | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

## Generated Assets (No External Attribution)

| Asset | Usage | Source | License |
|-------|-------|--------|---------|
| Arcade banner | Red Hat Arcade thumbnail (`arcade-banner.jpg`, `arcade-banner.png`) | Generated from `frontend/public/arcade-banner-source.html` via Puppeteer. Uses Google Fonts (Cinzel, Crimson Text). | Original work, no external image assets |

## Code/No External Assets

- **UI sound effects:** Web Audio API (procedural, no files)
