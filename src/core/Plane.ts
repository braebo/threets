import type { GeometryOptions } from './Geometry'
import type { Stage } from './Stage'
import type { Vec3 } from './Vector3'

import { Vector3, isVector3 } from './Vector3'
import { Geometry } from './Geometry'

export interface PlaneOptions extends GeometryOptions {
	scale: number
	width: number
	height: number
	subdivisions: number
}

export class Plane extends Geometry {
	get scale(): Vector3 {
		return this.transform?.scale
	}
	set scale(value: number | Vector3 | Vec3) {
		this.transform?.scaleBy(...(isVector3(value) ? value : new Vector3(value)).toArray())
	}

	constructor(stage: Stage, options?: Partial<PlaneOptions>) {
		const opts = {
			width: options?.width ?? 1,
			height: options?.height ?? 1,
			subdivisions: options?.subdivisions ?? 1,
			transform: options?.transform,
		}
		const { width, height, subdivisions } = opts

		const positions = []
		const indices = []

		const halfWidth = width / 2
		const stepX = width / subdivisions

		const halfHeight = height / 2
		const stepY = height / subdivisions

		let index = 0
		for (let y = -halfHeight; y < halfHeight; y += stepY) {
			for (let x = -halfWidth; x < halfWidth; x += stepX) {
				positions.push(x, y, 0)
				positions.push(x + stepX, y, 0)
				positions.push(x, y + stepY, 0)
				positions.push(x + stepX, y + stepY, 0)

				indices.push(index, index + 1, index + 2)
				indices.push(index + 1, index + 3, index + 2)

				index += 4
			}
		}

		super(stage, {
			...options,
			name: options?.name ?? 'a_position',
			positions: options?.positions ?? new Float32Array(),
			indices: options?.indices,
		})
	}
}
