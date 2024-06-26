import type { Gui, Folder, FolderOptions } from './gooey'
import type { CameraGui } from './CameraGui'
import type { Mat4 } from './Matrix4'
import type { Vec3 } from './Vector3'
import type { Stage } from './Stage'

import { OrbitController, type OrbitControllerOptions } from '../OrbitController'
import { WASDController, type WASDControllerOptions } from '../WASDController'
import { Transform } from './Transform'
import { Vector3 } from './Vector3'
import { Angle } from './Angle'

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
	 * Overrides the default camera position.
	 */
	position?: Vec3
	/**
	 * Overrides the default camera rotation.
	 */
	rotation?: Vec3
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

	private _dirty = true
	private _transform: Transform
	private _viewMatrix!: Mat4
	private _projectionMatrix!: Mat4
	private _projectionMatrixInverse!: Mat4

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

		const position = new Vector3(0, 1, -5)
		if (options?.position) position.set(options.position)

		const rotation = new Vector3(0)
		if (options?.rotation) rotation.set(options.rotation)

		const scale = new Vector3(1)

		this._transform = new Transform({
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

	get position(): Vector3 {
		return this._transform.position
	}

	get rotation(): Vector3 {
		return this._transform.rotation
	}

	/**
	 * Updates controllers, view matrix, and projection matrix.
	 * @returns `false` if no changes were detected.  If the camera is "dirty", updates are run
	 * and this returns `true`.
	 */
	update(force = false): boolean {
		if (this.controllers.orbit?.dirty) {
			this._dirty = true
			this.controllers.orbit.dirty = false

			this._transform.position.copy(this.controllers.orbit.position)
			// this.transform.rotation.copy(this.controllers.orbit.quaternion.toEulerAngles())
			this._transform.lookAt(this.controllers.orbit.target, this.up)

			// Keep the WASD controller in sync with the orbit controller.
			this.controllers.wasd?.position.copy(this._transform.position)
		}

		if (this.controllers.wasd?.dirty) {
			this._dirty = true
			this.controllers.wasd.dirty = false

			// this.controllers.wasd.update()
			this._transform.position.copy(this.controllers.wasd.position)
			this._transform.rotation.copy(this.controllers.wasd.rotation)

			// Keep the orbit controller in sync with the WASD controller.
			this.controllers.orbit?.position.copy(this._transform.position)
		}

		if (!force && !this._dirty) {
			console.error(
				'Camera.update() called without changes. Use `force` to bypass this check.',
			)
			console.log('this._dirty:', this._dirty)
			return false
		}

		this._transform.update()
		this.updateViewMatrix()
		this.updateProjectionMatrix()
		this._dirty = false
		return true
	}

	updateViewMatrix(): this {
		this._viewMatrix = Transform.inverse(this._transform.matrix)
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

	gui?: CameraGui
	async addGui(folder: Gui | Folder, options?: Partial<FolderOptions> & { title: string }) {
		const { CameraGui } = await import('./CameraGui')
		this.gui = new CameraGui(this, folder.addFolder(options?.title ?? 'camera', options))
		return this.gui
	}
}
