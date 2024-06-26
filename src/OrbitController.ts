import type { Stage } from './core/Stage'

import { Spherical } from './core/Spherical'
import {
	// Log,
	select,
} from './core/utils'
import { Vector3 } from './core/Vector3'
import { Vector2 } from './core/Vector2'
import { Quaternion } from './core/Quaternion'

/**
 * The event listener target element, window, or selector.
 *
 * This is unresolved until {@link OrbitController.init|init} is called, at which point it will be resolved to:
 * - `window` - {@link globalThis.window}.
 * - `canvas` - Use the canvas element on {@link OrbitController.init|init}.
 * - HTMLElement - Use the given element.
 * - string - Use the element selected by the given selector.
 */
export type ControllerEventTarget = 'window' | 'canvas' | Window | HTMLElement | string

export interface OrbitControllerOptions {
	/**
	 * The target point to orbit around.
	 */
	target: Vector3
	/**
	 * The event listener target.
	 * @default `canvas`
	 */
	domElement?: ControllerEventTarget
	/**
	 * Automatically initialize the controller, adding event listeners to the {@link domElement}.
	 * @default true
	 */
	autoInit?: boolean
	/**
	 * Automatically call {@link update} when the controller is activated or deactivated.
	 * @default true
	 */
	autoUpdate?: boolean
	/**
	 * Hide the mouse cursor when a control is activated.
	 * @default false
	 */
	capturePointerLock?: boolean
	/**
	 * Disables the controller when set to `false`.
	 * @default true
	 */
	enabled?: boolean
	/**
	 * The base speed of the controller.
	 * @default 1
	 */
	speed?: number
	/**
	 * Zoom speed multiplier.
	 */
	zoomSpeed?: number
	/**
	 * Calls `e.preventDefault` on internal events when `true`.  Useful for preventing scrolling.
	 * @default true
	 */
	preventDefault?: boolean
}

/**
 * Orbits a camera around a target.
 *
 * @example
 * ```ts
 * const stage = new Stage()
 * const controls = new OrbitControls(stage, { target: new Vector3(0) })
 * ```
 */
// @Log('OrbitControls', ['update'])
export class OrbitController implements OrbitControllerOptions {
	initialized = false
	target = new Vector3(0)
	capturePointerLock = false
	enabled = true
	autoUpdate = true
	active = false
	preventDefault = true
	zoomSpeed = 1

	domElement?: Window | HTMLElement
	private _eventTarget: ControllerEventTarget = 'canvas'
	private _speed = 1
	private _speedMultiplier = 1
	get speed() {
		return this._speed * this._speedMultiplier
	}
	set speed(value) {
		this._speed = value
	}
	get camera() {
		return this.stage?.camera
	}

	dirty = true
	private _zoomDirty = false

	private _position = new Vector3()
	get position() {
		return this._position
	}

	private _quaternion = new Quaternion()
	get quaternion() {
		return this._quaternion
	}

	private _spherical = new Spherical()
	private _sphericalDelta = new Spherical()
	private _scale = 1
	private _panOffset = new Vector3()
	private _pointerStart = new Vector2()
	private _pointerEnd = new Vector2()
	private _tempVec3 = new Vector3()
	private _tempQuaternion = new Quaternion()

	constructor(
		public stage: Stage,
		options?: OrbitControllerOptions,
	) {
		if (options?.target) this.target = options.target
		if (options?.enabled) this.enabled = options.enabled
		if (options?.autoUpdate) this.autoUpdate = options.autoUpdate
		if (options?.domElement) this._eventTarget = options.domElement
		if (options?.speed) this._speed = options.speed
		if (options?.capturePointerLock) this.capturePointerLock = options.capturePointerLock
		if (options?.zoomSpeed) this.zoomSpeed = options.zoomSpeed

		stage.camera.controllers.orbit ??= this

		if (options?.autoInit ?? true) {
			this.init()
		}
	}

	/**
	 * Initialize the controls, adding event listeners to the {@link domElement}.
	 */
	init() {
		if (this.initialized) return
		this.stage.camera.controllers.orbit ??= this

		this.initialized = true
		this.domElement = this._resolveTarget(this._eventTarget)
		this.domElement.addEventListener('pointerdown', this._onPointerDown as EventListener)
		this.domElement.addEventListener('pointermove', this._onPointerMove as EventListener)
		globalThis.window.addEventListener('pointerup', this._onPointerUp as EventListener)
		this.domElement.addEventListener('blur', this.cancel)
		this.domElement.addEventListener('wheel', this._onWheel as EventListener)

		// Set the initial spherical coordinates based on the camera position
		this._spherical.setFromVectors(this.camera.position, this.target)

		this._position.copy(this.camera.position)

		if (this.stage && (this.autoUpdate ?? true)) {
			this.update()
			// this.camera.lookAt(this.target)
		}
	}

	/**
	 * Cancel all active {@link moves} and reset {@link state}.
	 */
	cancel = () => {
		this.active = false
		this._speedMultiplier = 1

		if (this.capturePointerLock) {
			document.exitPointerLock()
		}
	}

	/**
	 * Update the camera's position based on the current spherical coordinates.
	 * @returns `false` if the controller is disabled or inactive, otherwise `true`.
	 */
	update(): boolean {
		if (!this.enabled) return false
		if (!this.active && !this._zoomDirty) return false

		// Apply rotation
		this._spherical.theta += this._sphericalDelta.theta
		this._spherical.phi += this._sphericalDelta.phi

		// Clamp phi to avoid going over the poles
		this._spherical.phi = Math.max(0.000001, Math.min(Math.PI - 0.000001, this._spherical.phi))

		// Apply zoom
		this._spherical.radius *= this._scale

		// Apply pan
		this.target.add(this._panOffset)

		// prettier-ignore
		// Calculate new position
		this._tempVec3.setXYZ(
			this._spherical.radius * Math.sin(this._spherical.phi) * Math.sin(this._spherical.theta),
			this._spherical.radius * Math.cos(this._spherical.phi),
			this._spherical.radius * Math.sin(this._spherical.phi) * Math.cos(this._spherical.theta),
		)

		// // Apply position
		this.position.copy(this.target).add(this._quaternion.rotateVector(this._tempVec3))

		// Apply position
		// this.position.copy(this.target).add(this._tempVec3)

		// // Update quaternion
		this._tempQuaternion.fromEuler(this._sphericalDelta.phi, this._sphericalDelta.theta, 0)
		this._quaternion.multiply(this._tempQuaternion)

		// Reset deltas
		this._sphericalDelta.set(0, 0, 0)
		this._scale = 1
		this._panOffset.setXYZ(0, 0, 0)

		this.dirty = true

		if (this.autoUpdate) {
			this.stage.camera.update()
		}

		return true
	}

	zoom(delta: number): void {
		this._scale *= 1 - delta * this.zoomSpeed
		this._scale = Math.max(0.01, Math.min(100, this._scale))
		this._zoomDirty = true
	}

	private _onPointerMove = (event: PointerEvent) => {
		if (!this.enabled) return
		if (this.preventDefault && event.target === this.domElement) event.preventDefault()
		if (!this.active) return

		this._pointerEnd.setXY(event.clientX, event.clientY)

		// Calculate the pointer movement delta
		const delta = new Vector2(
			this._pointerEnd.x - this._pointerStart.x,
			this._pointerEnd.y - this._pointerStart.y,
		)

		// Update spherical delta for rotation
		this._sphericalDelta.theta -=
			((2 * Math.PI * delta.x) / (this.eventTargetWidth() || 1)) * this.speed
		this._sphericalDelta.phi -=
			((Math.PI * delta.y) / (this.eventTargetHeight() || 1)) * this.speed

		// Clamp phi to avoid flipping
		this._sphericalDelta.phi = Math.max(
			-Math.PI / 2,
			Math.min(Math.PI / 2, this._sphericalDelta.phi),
		)

		this._pointerStart.copy(this._pointerEnd)
	}

	private _onWheel = (event: WheelEvent) => {
		if (!this.enabled) return
		if (this.preventDefault) event.preventDefault()

		const delta = event.deltaY
		this.zoom(delta > 0 ? 0.1 : -0.1)
	}

	private _onPointerDown = (event: PointerEvent) => {
		if (!this.enabled) return
		if (this.preventDefault) event.preventDefault()
		if (this.active) return

		this.active = true
		this._position.copy(this.camera.position)

		this._pointerStart.setXY(event.clientX, event.clientY)
		this._spherical.setFromVectors(this.camera.position, this.target)

		if (this.capturePointerLock) {
			if (this.domElement instanceof (HTMLElement || Window)) {
				this.domElement.requestPointerLock()
			} else {
				globalThis.document?.body?.requestPointerLock()
			}
		}
	}

	private _onPointerUp = (event: PointerEvent) => {
		if (!this.enabled) return
		if (this.preventDefault) event.preventDefault()
		if (!this.active) return

		this.active = false
	}

	// caching refs
	private eventTargetWidth!: () => number
	private eventTargetHeight!: () => number
	private _resolveTarget(target: ControllerEventTarget) {
		const error = new Error(
			`OrbitController.init() - Failed to locate target element: ${target}`,
		)

		if (!target) throw error

		if (typeof target === 'string') {
			if (target === 'window') target = globalThis.window
			else if (target === 'canvas') target = this.stage.canvas
			else target = select(target) as HTMLElement
		}

		if (target == globalThis.window) {
			this.eventTargetWidth = () => globalThis.innerWidth
			this.eventTargetHeight = () => globalThis.innerHeight
			return target
		}

		if (target instanceof HTMLElement) {
			this.eventTargetWidth = () => (this.domElement as HTMLElement)?.clientWidth
			this.eventTargetHeight = () => (this.domElement as HTMLElement)?.clientHeight
			return target
		}

		throw error
	}

	dispose() {
		this.cancel()
		this.domElement?.removeEventListener('pointerdown', this._onPointerDown as EventListener)
		this.domElement?.removeEventListener('pointermove', this._onPointerMove as EventListener)
		globalThis.window.removeEventListener('pointerup', this._onPointerUp as EventListener)
		this.domElement?.removeEventListener('blur', this.cancel)
		this.domElement?.removeEventListener('wheel', this._onWheel as EventListener)
	}
}
