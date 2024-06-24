import type { Stage } from './Stage'
import type { Mat4 } from './Matrix4'

import { OrbitController, type OrbitControllerOptions } from '../OrbitController'
import { WASDController, type WASDControllerOptions } from '../WASDController'
import { Transform, type TransformOptions } from './Transform'
import { Vector3 } from './Vector3'
import { Angle } from './Angle'
// import { Log } from './utils'

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
	near?: number
	/**
	 * Far clipping plane.
	 * @default 2000
	 */
	far?: number
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

// @Log('Camera', { exclude: ['viewMatrix', 'projectionMatrix'] })
export class Camera {
	private _fov = new Angle(60)
	private _angle = new Angle(0)
	private _aspect = 1
	private _near = 0.1
	private _far = 20000

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

	private _viewMatrix!: Mat4
	private _projectionMatrix!: Mat4
	private _projectionMatrixInverse!: Mat4
	private _dirty = true

	readonly transform: Transform

	constructor(
		public stage: Stage,
		options?: Partial<CameraOptions>,
	) {
		if (options) {
			if (options?.fov) this._fov.degrees = options.fov

			if (options.aspect) this._aspect = options?.aspect
			if (options.near) this._near = options?.near
			if (options.far) this._far = options?.far
		}

		// const transformOpts = options?.transform
		// const position = transformOpts?.position ?? new Vector3(0, 1, -5)
		// position.onChange(() => (this._dirty = true))
		// const rotation = transformOpts?.rotation ?? new Vector3(0)
		// rotation.onChange(() => (this._dirty = true))
		// const scale = transformOpts?.scale ?? new Vector3(1)
		// scale.onChange(() => (this._dirty = true))

		const position = new Vector3(0, 1, -5)
		if (options?.transform?.position) position.set(options.transform.position)

		const rotation = new Vector3(0)
		if (options?.transform?.rotation) rotation.set(options.transform.rotation)

		const scale = new Vector3(1)
		if (options?.transform?.scale) scale.set(options.transform.scale)

		// const transformOpts = options?.transform
		// const position = new Vector3(transformOpts?.position ?? { x: 0, y: 1, z: -5 })
		// position.onChange(() => (this._dirty = true))
		// const rotation = new Vector3(transformOpts?.rotation ?? 0)
		// rotation.onChange(() => (this._dirty = true))
		// const scale = new Vector3(transformOpts?.scale ?? 1)
		// scale.onChange(() => (this._dirty = true))

		console.log(position.get())
		console.log(rotation.get())
		console.log(scale.get())

		this.transform = new Transform({
			position,
			rotation,
			scale,
		})

		this._projectionMatrix = Transform.perspective(
			this._fov.radians,
			this.aspect,
			this.near,
			this.far,
		)
		this._projectionMatrixInverse = Transform.inverse(this._projectionMatrix)

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

		// this.updateViewMatrix()
		// this.updateProjectionMatrix()
		this.update()
	}

	/**
	 * Field of view in degrees.
	 * @default 60
	 */
	get fov(): number {
		return this._fov.degrees
	}
	set fov(value: number) {
		this._fov.degrees = value
		this.updateProjectionMatrix()
	}

	set angle(value: number) {
		this._angle.degrees = value
		this.updateProjectionMatrix()
	}
	get angle(): number {
		return this._angle.degrees // TypeError: Cannot read property 'degrees' of undefined
	}

	/**
	 * Aspect ratio (width / height).
	 * @default 1
	 */
	get aspect(): number {
		return this._aspect
	}
	set aspect(value: number) {
		this._aspect = value
		this.updateProjectionMatrix()
	}

	/**
	 * Near clipping plane.
	 * @default 0.1
	 */
	get near(): number {
		return this._near
	}
	set near(value: number) {
		this._near = value
		this.updateProjectionMatrix()
	}

	/**
	 * Far clipping plane.
	 * @default 2000
	 */
	get far(): number {
		return this._far
	}
	set far(value: number) {
		this._far = value
		this.updateProjectionMatrix()
	}

	get viewMatrix(): Mat4 {
		return this._viewMatrix
	}

	get projectionMatrix(): Mat4 {
		return this._projectionMatrix
	}
	
	get projectionMatrixInverse(): Mat4 {
		return this._projectionMatrixInverse
	}

	/**
	 * Updates controllers, view matrix, and projection matrix.
	 * @returns `false` if no changes were detected.  If the camera is "dirty", updates are run
	 * and this returns `true`.
	 */
	update(): boolean {
		if (this.controllers.orbit?.dirty) {
			this._dirty = true
			this.transform.position.copy(this.controllers.orbit.position)
			// this.transform.rotation.copy(this.controllers.orbit.quaternion.toEulerAngles())
			this.transform.lookAt(this.controllers.orbit.target, this.up)
			this.controllers.orbit.dirty = false
		}
		// todo - update wasd to pull like orbit above
		this._dirty ||= !!this.controllers.wasd?.update()

		if (!this._dirty) {
			console.error('Camera.update() called without changes')
			console.log('this._dirty:', this._dirty)
			return false
		}
		this.transform.update()
		this.updateViewMatrix()
		this.updateProjectionMatrix()
		this._dirty = false
		return true
	}

	updateViewMatrix(): this {
		this._viewMatrix = Transform.inverse(this.transform.matrix)
		return this
	}

	updateProjectionMatrix(): this {
		this._projectionMatrix = Transform.perspective(
			this._fov.radians,
			this.aspect,
			this.near,
			this.far,
		)
		this._projectionMatrixInverse = Transform.inverse(this._projectionMatrix)
		return this
	}
}
