import type { Geometry } from './Geometry'
import type { Folder } from './gooey'
import type { Vector3 } from './Vector3'

export class GeometryGui {
	folders = {} as {
		position: Folder
		rotation: Folder
	}

	constructor(
		public obj: Geometry,
		public folder: Folder,
	) {
		this.folders.position = folder.addFolder('position', { closed: true })
		xyz(obj.transform.position, this.folders.position)

		this.folders.rotation = folder.addFolder('rotation', { closed: true })
		xyz(obj.transform.rotation, this.folders.rotation)

		folder.on('change', () => obj.transform.update())

		function xyz(obj: Vector3, folder: Folder): void {
			;(['x', 'y', 'z'] as const).forEach((axis) =>
				folder.addNumber(obj, axis, { step: 0.1 }),
			)
		}
	}
}
