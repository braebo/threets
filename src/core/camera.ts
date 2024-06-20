import type { Stage } from './Stage'

import { OrbitController, type OrbitControllerOptions } from '../OrbitController'
import { WASDController, type WASDControllerOptions } from '../WASDController'
import { Vector3, type Vec3, type Vector3Like } from './Vector3'
import { Transform, type TransformOptions } from './Transform'
import { Angle } from './Angle'
import { Log } from './utils'

export interface CameraOptions {
	/**
	 * Field of view in degrees.
	 * @default 60
	 */
	fov?: number
	/**
	 * Aspect ratio (width / height).
	 * @default 1
	 */
	aspect?: number
	/**
	 * Near clipping plane.
	 * @default 1
	 */
	zNear?: number
	/**
	 * Far clipping plane.
	 * @default 2000
	 */
	zFar?: number
	/**
	 * Overrides the default camera transforms.
	 */
	transform?: Partial<TransformOptions>
	/**
	 * Optional camera controllers.
	 */
	controllers?: {
		/**
		 * If provided, a {@link WASDController} will be added with these options and made
		 * accessible via {@link Camera.controllers.wasd}. Set to `true` to use default options.
		 * @see {@link WASDControllerOptions}
		 */
		wasd?: WASDControllerOptions | true
		/**
		 * If provided, an {@link OrbitController} will be added with these options and made
		 * accessible via {@link Camera.controllers.orbit}. Set to `true` to use default options.
		 * @see {@link OrbitControllerOptions}
		 */
		orbit?: OrbitControllerOptions | true
	}
}

@Log('Camera')
export class Camera {
	/**
	 * Field of view.
	 */
	fov = new Angle(60)
	/**
	 * Camera angle.
	 */
	angle = new Angle(0)
	/**
	 * Aspect ratio (width / height).
	 * @default 1
	 */
	aspect = 1
	/**
	 * Near clipping plane.
	 */
	near = 0.1
	/**
	 * Far clipping plane.
	 */
	far = 20000
	/**
	 * Up vector.
	 */
	up = new Vector3(0, 1, 0)
	/**
	 * Optional camera controllers.  Created when {@link CameraOptions.controllers} is provided.
	 *
	 * To create a controller after instantiation:
	 * ```ts
	 * camera.controllers.wasd = new WASDController(stage)
	 * ```
	 */
	controllers = {} as {
		wasd?: WASDController
		orbit?: OrbitController
	}

	readonly transform: Transform

	constructor(public stage: Stage, options?: Partial<CameraOptions>) {
		if (options?.fov) this.fov.degrees = options.fov

		this.aspect = options?.aspect ?? 1
		this.near = options?.zNear ?? 1
		this.far = options?.zFar ?? 2000

		const transformOpts = options?.transform
		const position = transformOpts?.position ?? new Vector3(0)
		const rotation = transformOpts?.rotation ?? new Vector3(0)
		const scale = transformOpts?.scale ?? new Vector3(1)

		this.transform = new Transform({
			identity: () =>
				Transform.perspective(this.fov.radians, this.aspect, this.near, this.far),
			position,
			rotation,
			scale,
		})

		if (options?.controllers) {
			if (options.controllers.wasd) {
				const opts = options.controllers.wasd === true ? {} : options.controllers.wasd
				this.controllers.wasd = new WASDController(this.stage, opts)
			}
			if (options.controllers.orbit) {
				const opts =
					options.controllers.orbit === true ? undefined : options.controllers.orbit
				this.controllers.orbit = new OrbitController(this.stage, opts)
			}
		}
	}

	update() {
		this.transform.update()
		this.controllers?.wasd?.update()
		this.controllers?.orbit?.update()
	}

	lookAt(target: Vec3 | Vector3) {
		this.transform.lookAt(target, this.up)
	}

	updateFOV(fov_deg: number) {
		this.fov.degrees = fov_deg
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
