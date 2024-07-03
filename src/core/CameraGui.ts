import type { Folder } from './gooey'
import type { Camera } from './Camera'

export class CameraGui {
	constructor(
		public obj: Camera,
		folder: Folder,
	) {
		folder.bindNumber(obj, 'fov', { min: 1, max: 179, step: 1 })
		folder.bindNumber(obj, 'aspect', { min: 0.1, max: 10, step: 0.1 })
		folder.bindNumber(obj, 'near', { min: 0.00001, max: 100, step: 0.0001 })
		folder.bindNumber(obj, 'far', { min: 100, max: 10000, step: 100 })

		const positionFolder = folder.addFolder('position')
		positionFolder.bindNumber(obj.position, 'x', { min: -500, max: 500, step: 0.1 })
		positionFolder.bindNumber(obj.position, 'y', { min: -500, max: 500, step: 0.1 })
		positionFolder.bindNumber(obj.position, 'z', { min: -500, max: 500, step: 0.1 })

		folder.on('change', () => obj.update(true))
	}
}
