import './style.css'
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { HeistScene } from './scenes/HeistScene'

// Bootstraps the game shell: shares the game viewport with the fixed facility map.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 800,
  height: 640,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MenuScene, HeistScene],
})
