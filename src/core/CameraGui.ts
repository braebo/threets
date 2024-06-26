import type { Folder } from './gooey'
import type { Camera } from './Camera'

export class CameraGui {
	constructor(
		public obj: Camera,
		folder: Folder,
	) {
		folder.addNumber(obj, 'fov', { min: 1, max: 179, step: 1 })
        folder.addNumber(obj, 'aspect', { min: 0.1, max: 10, step: 0.1 })
        folder.addNumber(obj, 'near', { min: 0.00001, max: 100, step: 0.0001 })
        folder.addNumber(obj, 'far', { min: 100, max: 10000, step: 100 })
        const positionFolder = folder.addFolder('position')
        positionFolder.addNumber(obj.position, 'x', { step: 0.1 })
        positionFolder.addNumber(obj.position, 'y', { step: 0.1 })
        positionFolder.addNumber(obj.position, 'z', { step: 0.1 })

        folder.on('change', () => obj.update(true))
	}
}
