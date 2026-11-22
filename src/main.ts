import Phaser from 'phaser'
import { HEIGHT, WIDTH } from './config/field'
import { FlightScene } from './scenes/FlightScene'
import { registerWorker } from './utils/registerWorker'
import './style.css'
import './ui/hangar.css'

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'screen',
  width: WIDTH,
  height: HEIGHT,
  scene: FlightScene,
  fps: { smoothStep: false },
  input: { keyboard: false, mouse: false, touch: false },
  banner: false,
})

registerWorker()
