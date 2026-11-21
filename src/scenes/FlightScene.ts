import Phaser from 'phaser'
import { HEIGHT, WIDTH } from '../config/field'

export class FlightScene extends Phaser.Scene {
  constructor() {
    super('flight')
  }

  create() {
    const field = this.add.graphics()
    field.fillStyle(0x080b19).fillRect(0, 0, WIDTH, HEIGHT)
    field.fillStyle(0x79eaff)
    for (let index = 0; index < 92; index++) {
      field.fillCircle((index * 197) % WIDTH, (index * 107) % HEIGHT, index % 7 === 0 ? 1.4 : 0.65)
    }
  }
}
