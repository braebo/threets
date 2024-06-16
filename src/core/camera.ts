// import { Mat4, Matrix4 } from './matrix'

import { Transform, type TransformOptions } from './transform'
import { Vector3 } from './vectors'
import { degToRad } from './utils'

export interface CameraOptions {
	fov: number
	aspect: number
	zNear: number
	zFar: number
	transform?: TransformOptions
}

export class Camera {
	/**
	 * Field of view in radians.
	 */
	fov = degToRad(60)

	/**
	 * Camera angle in radians.
	 */
	angle = degToRad(0)

	/**
	 * Aspect ratio (width / height).
	 * @default 1
	 */
	aspect = 1

	/**
	 * Near clipping plane.
	 */
	near = 1

	/**
	 * Far clipping plane.
	 */
	far = 2000

	transform: Transform

	constructor(options?: CameraOptions) {
		this.fov = options?.fov ?? degToRad(60)
		this.aspect = options?.aspect ?? 1
		this.near = options?.zNear ?? 1
		this.far = options?.zFar ?? 2000
		// this.matrix = Matrix4.perspective(this.fov, this.aspect, this.near, this.far)

		const transformOpts = options?.transform
		const position = transformOpts?.position ?? new Vector3({ x: -150, y: 0, z: -360 })
		const rotation = transformOpts?.rotation ?? new Vector3({ x: degToRad(190), y: degToRad(40), z: degToRad(320) })
		const scale = transformOpts?.scale ?? new Vector3({ x: 1, y: 1, z: 1 })

		this.transform = new Transform({
			identity: () => Transform.perspective(this.fov, this.aspect, this.near, this.far),
			position,
			rotation,
			scale,
		})
	}

	updateFOV(fov_deg: number) {
		this.fov = degToRad(fov_deg)
	}

	updatePosition = (index: 'x' | 'y' | 'z') => {
		return (value: number) => {
			this.transform.position[index] = value
		}
	}

	updateRotation = (index: 'x' | 'y' | 'z') => {
		return (angle_degrees: number) => {
			const angle_radians = (angle_degrees * Math.PI) / 180
			this.transform.rotation[index] = angle_radians
		}
	}

	updateScale(index: 'x' | 'y' | 'z') {
		return (value: number) => {
			this.transform.scale[index] = value
		}
	}
}
