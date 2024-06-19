import type { Vec3, Vector3Like } from './vectors'

import { Transform, type TransformOptions } from './transform'
import { degToRad, Log } from './utils'
import { Vector3 } from './vectors'

export interface CameraOptions {
	fov: number
	aspect: number
	zNear: number
	zFar: number
	transform: Partial<TransformOptions>
}

@Log('Camera')
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

	up = new Vector3(0, 1, 0)

	readonly transform: Transform

	constructor(options?: Partial<CameraOptions>) {
		this.fov = options?.fov ?? degToRad(60)
		this.aspect = options?.aspect ?? 1
		this.near = options?.zNear ?? 1
		this.far = options?.zFar ?? 2000

		const transformOpts = options?.transform
		const position = transformOpts?.position ?? new Vector3(0)
		const rotation = transformOpts?.rotation ?? new Vector3(0)
		const scale = transformOpts?.scale ?? new Vector3(1)

		this.transform = new Transform({
			identity: () => Transform.perspective(this.fov, this.aspect, this.near, this.far),
			position,
			rotation,
			scale,
		})

		// todo - make position.x = 4 reactively call transform.update() ?
		// this.position = new Proxy
	}

	lookAt(target: Vec3 | Vector3, up = this.up) {
		Transform.lookAt(this.transform.position, target, up)
	}

	updateFOV(fov_deg: number) {
		this.fov = degToRad(fov_deg)
	}

	updatePosition(value: Vector3Like) {
		this.transform.position.set(value)
	}

	updateRotation = (value: Vector3Like) => {
		this.transform.rotation.set(value)
	}

	updateScale(value: Vector3Like) {
		this.transform.scale.set(value)
	}
}
