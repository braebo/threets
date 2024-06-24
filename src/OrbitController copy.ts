// import type { Stage } from './core/Stage'

// import { Spherical } from './core/Spherical'
// import {
// 	// Log,
// 	select,
// } from './core/utils'
// import { Vector3 } from './core/Vector3'
// import { Vector2 } from './core/Vector2'
// import { Quaternion } from './core/Quaternion'

// /**
//  * The event listener target element, window, or selector.
//  *
//  * This is unresolved until {@link OrbitController.init|init} is called, at which point it will be resolved to:
//  * - `window` - {@link globalThis.window}.
//  * - `canvas` - Use the canvas element on {@link OrbitController.init|init}.
//  * - HTMLElement - Use the given element.
//  * - string - Use the element selected by the given selector.
//  */
// export type ControllerEventTarget = 'window' | 'canvas' | Window | HTMLElement | string

// export interface OrbitControllerOptions {
// 	/**
// 	 * The target point to orbit around.
// 	 */
// 	target: Vector3
// 	/**
// 	 * The event listener target.
// 	 * @default `canvas`
// 	 */
// 	eventTarget?: ControllerEventTarget
// 	/**
// 	 * Automatically initialize the controller, adding event listeners to the {@link eventTarget}.
// 	 * @default true
// 	 */
// 	autoInit?: boolean
// 	/**
// 	 * Automatically call {@link update} when the controller is activated or deactivated.
// 	 * @default true
// 	 */
// 	autoUpdate?: boolean
// 	/**
// 	 * Hide the mouse cursor when a control is activated.
// 	 * @default false
// 	 */
// 	capturePointerLock?: boolean
// 	/**
// 	 * Disables the controller when set to `false`.
// 	 * @default true
// 	 */
// 	enabled?: boolean
// 	/**
// 	 * The base speed of the controller.
// 	 * @default 1
// 	 */
// 	speed?: number
// 	/**
// 	 * Zoom speed multiplier.
// 	 */
// 	zoomSpeed?: number
// 	/**
// 	 * Calls `e.preventDefault` on internal events when `true`.  Useful for preventing scrolling.
// 	 * @default true
// 	 */
// 	preventDefault?: boolean
// }

// /**
//  * Orbits a camera around a target.
//  *
//  * @example
//  * ```ts
//  * const stage = new Stage()
//  * const controls = new OrbitControls(stage, { target: new Vector3(0) })
//  * ```
//  */
// // @Log('OrbitControls', ['update'])
// export class OrbitController implements OrbitControllerOptions {
// 	initialized = false
// 	target = new Vector3(0)
// 	capturePointerLock = false
// 	enabled = true
// 	autoUpdate = true
// 	active = false
// 	preventDefault = true
// 	zoomSpeed = 1

// 	eventTarget?: Window | HTMLElement
// 	private _eventTarget: ControllerEventTarget = 'canvas'
// 	private _speed = 1
// 	private _speedMultiplier = 1
// 	get speed() {
// 		return this._speed * this._speedMultiplier
// 	}
// 	set speed(value) {
// 		this._speed = value
// 	}
// 	get camera() {
// 		return this.stage?.camera
// 	}

// 	dirty = true
// 	_zoomDirty = false

// 	private _position = new Vector3()
// 	get position() {
// 		return this._position
// 	}

// 	private _quaternion = new Quaternion()
// 	get quaternion() {
// 		return this._quaternion
// 	}

// 	private _scale = 1

// 	constructor(
// 		public stage: Stage,
// 		options?: OrbitControllerOptions,
// 	) {
// 		if (options?.target) this.target = options.target
// 		if (options?.enabled) this.enabled = options.enabled
// 		if (options?.autoUpdate) this.autoUpdate = options.autoUpdate
// 		if (options?.eventTarget) this._eventTarget = options.eventTarget
// 		if (options?.speed) this._speed = options.speed
// 		if (options?.capturePointerLock) this.capturePointerLock = options.capturePointerLock
// 		if (options?.zoomSpeed) this.zoomSpeed = options.zoomSpeed

// 		if (options?.autoInit ?? true) {
// 			this.init()
// 		}
// 	}

// 	/**
// 	 * Initialize the controls, adding event listeners to the {@link eventTarget}.
// 	 */
// 	init() {
// 		if (this.initialized) return
// 		this.stage.camera.controllers.orbit ??= this

// 		this.initialized = true
// 		this.eventTarget = this._resolveTarget(this._eventTarget)
// 		this.eventTarget.addEventListener('pointerdown', this.onPointerDown as EventListener)
// 		this.eventTarget.addEventListener('pointermove', this.onPointerMove as EventListener)
// 		globalThis.window.addEventListener('pointerup', this.onPointerUp as EventListener)
// 		this.eventTarget.addEventListener('blur', this.cancel)
// 		this.eventTarget.addEventListener('wheel', this.onWheel as EventListener)

// 		// Set the initial spherical coordinates based on the camera position
// 		this._spherical.setFromVectors(this.camera.transform.position, this.target)

// 		this._position.copy(this.camera.transform.position)

// 		if (this.stage && (this.autoUpdate ?? true)) {
// 			this.update()
// 			// this.camera.lookAt(this.target)
// 		}
// 	}

// 	/**
// 	 * Cancel all active {@link moves} and reset {@link state}.
// 	 */
// 	cancel = () => {
// 		this.active = false
// 		this._speedMultiplier = 1

// 		if (this.capturePointerLock) {
// 			document.exitPointerLock()
// 		}
// 	}

// 	private _spherical = new Spherical()
// 	private _sphericalDelta = new Spherical()
// 	private _tempVec3 = new Vector3()
// 	private _panOffset = new Vector3()

// 	/**
// 	 * Update the camera's position based on the current spherical coordinates.
// 	 * @returns `false` if the controller is disabled or inactive, otherwise `true`.
// 	 */
// 	update(): boolean {
// 		if (!this.enabled) return false
// 		if (!this.active && !this._zoomDirty) return false

// 		/// Rotation logic goes here ///

// 		this.dirty = true

// 		if (this.autoUpdate) {
// 			console.log('OrbitController.update() called, dirty = ', this.dirty)
// 			this.stage.camera.update()
// 		}

// 		return true
// 	}

// 	zoom(delta: number): void {
// 		this._scale *= 1 - delta * this.zoomSpeed
// 		this._scale = Math.max(0.01, Math.min(100, this._scale))
// 		this._zoomDirty = true
// 	}

// 	private _pointerStart = new Vector2()
// 	private _pointerEnd = new Vector2()

// 	onPointerMove = (event: PointerEvent) => {
// 		if (!this.enabled) return
// 		if (this.preventDefault && event.target === this.eventTarget) event.preventDefault()
// 		if (!this.active) return

// 		const width = this.eventTargetWidth()
// 		const height = this.eventTargetHeight()

// 		/// Pointer move logic goes here ///
// 	}

// 	onWheel = (event: WheelEvent) => {
// 		if (!this.enabled) return
// 		if (this.preventDefault) event.preventDefault()

// 		const delta = event.deltaY
// 		this.zoom(delta > 0 ? 0.1 : -0.1)
// 	}

// 	onPointerDown = (event: PointerEvent) => {
// 		if (!this.enabled) return
// 		if (this.preventDefault) event.preventDefault()
// 		if (this.active) return

// 		this.active = true

// 		this._pointerStart.setXY(event.clientX, event.clientY)
// 		this._position.copy(this.camera.transform.position)
// 		this._spherical.setFromVectors(this.camera.transform.position, this.target)

// 		if (this.capturePointerLock) {
// 			if (this.eventTarget instanceof HTMLElement) {
// 				this.eventTarget.requestPointerLock()
// 			} else {
// 				globalThis.document?.body?.requestPointerLock()
// 			}
// 		}
// 	}

// 	onPointerUp = (event: PointerEvent) => {
// 		if (!this.enabled) return
// 		if (this.preventDefault) event.preventDefault()
// 		if (!this.active) return

// 		this.active = false
// 	}

// 	dispose() {
// 		this.cancel()
// 		this.eventTarget?.removeEventListener('pointerdown', this.onPointerDown as EventListener)
// 		this.eventTarget?.removeEventListener('pointermove', this.onPointerMove as EventListener)
// 		globalThis.window.removeEventListener('pointerup', this.onPointerUp as EventListener)
// 		this.eventTarget?.removeEventListener('blur', this.cancel)
// 		this.eventTarget?.removeEventListener('wheel', this.onWheel as EventListener)
// 	}

// 	// caching refs
// 	private eventTargetWidth!: () => number
// 	private eventTargetHeight!: () => number
// 	private _resolveTarget(target: ControllerEventTarget) {
// 		const error = new Error(
// 			`OrbitController.init() - Failed to locate target element: ${target}`,
// 		)

// 		if (!target) throw error

// 		if (typeof target === 'string') {
// 			if (target === 'window') target = globalThis.window
// 			else if (target === 'canvas') target = this.stage.canvas
// 			else target = select(target) as HTMLElement
// 		}

// 		if (target == globalThis.window) {
// 			this.eventTargetWidth = () => globalThis.innerWidth
// 			this.eventTargetHeight = () => globalThis.innerHeight
// 			return target
// 		}

// 		if (target instanceof HTMLElement) {
// 			this.eventTargetWidth = () => (this.eventTarget as HTMLElement)?.clientWidth
// 			this.eventTargetHeight = () => (this.eventTarget as HTMLElement)?.clientHeight
// 			return target
// 		}

// 		throw error
// 	}
// }
