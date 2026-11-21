import Phaser from 'phaser'
import { HEIGHT, WIDTH } from './config/field'
import { FlightScene } from './scenes/FlightScene'
import './style.css'

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'screen',
  width: WIDTH,
  height: HEIGHT,
  scene: FlightScene,
  input: { keyboard: false, mouse: false, touch: false },
  banner: false,
})
