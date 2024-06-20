import type { Stage } from './core/Stage'

import { Spherical } from './core/Spherical'
import { Log, select } from './core/utils'
import { Vector3 } from './core/Vector3'
import { Vector2 } from './core/Vector2'

/**
 * The event listener target element, window, or selector.
 *
 * This is unresolved until {@link OrbitController.init|init} is called, at which point it will be resolved to:
 * - `window` - {@link globalThis.window}.
 * - `canvas` - Use the canvas element on {@link OrbitController.init|init}.
 * - HTMLElement - Use the given element.
 */
export type ControllerEventTarget = 'window' | 'canvas' | Window | HTMLElement | string

export interface OrbitControllerOptions {
	/**
	 * The target point to orbit around.
	 */
	target: Vector3
	/**
	 * The event listener target.
	 * @default `window`
	 */
	eventTarget?: ControllerEventTarget
	/**
	 * Automatically initialize the controller, adding event listeners to the {@link eventTarget}.
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
@Log('OrbitControls', ['update'])
export class OrbitController implements OrbitControllerOptions {
	initialized = false
	target = new Vector3(0)
	capturePointerLock = false
	enabled = true
	autoUpdate = true
	active = false
	preventDefault = true

	eventTarget?: Window | HTMLElement
	private _eventTarget: ControllerEventTarget = 'window'
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

	private _position = new Vector3()
	private _spherical = new Spherical()
	private _sphericalDelta = new Spherical()
	private _scale = 1
	private _panOffset = new Vector3()
	private _pointerStart = new Vector2()
	private _pointerEnd = new Vector2()

	constructor(public stage: Stage, options?: OrbitControllerOptions) {
		if (options?.target) this.target = options.target
		if (options?.enabled) this.enabled = options.enabled
		if (options?.autoUpdate) this.autoUpdate = options.autoUpdate
		if (options?.eventTarget) this._eventTarget = options.eventTarget
		if (options?.speed) this._speed = options.speed
		if (options?.capturePointerLock) this.capturePointerLock = options.capturePointerLock

		if (options?.autoInit ?? true) {
			this.init()
		}
	}

	/**
	 * Initialize the controls, adding event listeners to the {@link eventTarget}.
	 */
	init() {
		if (this.initialized) return
		this.initialized = true
		this.eventTarget = this._resolveTarget(this._eventTarget)
		this.eventTarget.addEventListener('pointerdown', this.onPointerDown as EventListener)
		this.eventTarget.addEventListener('pointerup', this.onPointerUp as EventListener)
		this.eventTarget.addEventListener('pointermove', this.onPointerMove as EventListener)
		this.eventTarget.addEventListener('blur', this.cancel)

		// Set the initial spherical coordinates based on the camera position
		this._spherical.setFromVectors(this.camera.transform.position, this.target)

		this._position.copy(this.camera.transform.position)

		if (this.stage && (this.autoUpdate ?? true)) {
			this.update()
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

	update() {
		if (!this.enabled) return
		if (!this.active) return

		// Apply the spherical delta to the current spherical coordinates
		this._spherical.theta += this._sphericalDelta.theta
		this._spherical.phi += this._sphericalDelta.phi
		this._spherical.radius *= this._scale

		// Restrict phi to be between desired limits
		this._spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this._spherical.phi))

		// Restrict radius to be between desired limits
		this._spherical.radius = Math.max(1, Math.min(1000, this._spherical.radius))

		// Convert spherical coordinates to Cartesian coordinates
		const sinPhiRadius = Math.sin(this._spherical.phi) * this._spherical.radius

		this._position.setX(sinPhiRadius * Math.sin(this._spherical.theta))
		this._position.setY(Math.cos(this._spherical.phi) * this._spherical.radius)
		this._position.setZ(sinPhiRadius * Math.cos(this._spherical.theta))

		// Apply the pan offset to the position
		this._position.add(this._panOffset)

		// Update the camera's position and look at the target
		this.camera.transform.position.copy(this._position)
		this.camera.lookAt(this.target)

		// Reset the spherical delta and scale for the next update
		this._sphericalDelta.set(0, 0, 0)
		this._scale = 1

		if (this.autoUpdate) {
			// this.stage.camera.transform.update()
			this.stage.camera.update()
		}
	}

	onPointerMove = (event: PointerEvent) => {
		if (!this.enabled) return
		if (this.preventDefault) event.preventDefault()
		if (!this.active) return

		const width = this.eventTargetWidth()
		const height = this.eventTargetHeight()

		this._pointerEnd.set(event.clientX, event.clientY)

		// Calculate the pointer movement delta
		const delta = new Vector2(
			this._pointerEnd.x - this._pointerStart.x,
			this._pointerEnd.y - this._pointerStart.y,
		)

		// Update the spherical delta based on the pointer movement
		this._sphericalDelta.theta -= ((2 * Math.PI * delta.x) / (width || 1)) * this.speed
		this._sphericalDelta.phi -= ((Math.PI * delta.y) / (height || 1)) * this.speed

		this._pointerStart.setX(this._pointerEnd.x)
		this._pointerStart.setY(this._pointerEnd.y)
	}

	onPointerDown = (event: PointerEvent) => {
		if (!this.enabled) return
		if (this.preventDefault) event.preventDefault()
		if (this.active) return

		this.active = true

		this._pointerStart.set(event.clientX, event.clientY)
		this._position.copy(this.camera.transform.position)
		this._spherical.setFromVectors(this.camera.transform.position, this.target)

		if (this.capturePointerLock) {
			if (this.eventTarget instanceof HTMLElement) {
				this.eventTarget.requestPointerLock()
			} else {
				globalThis.document?.body?.requestPointerLock()
			}
		}
	}

	onPointerUp = (event: PointerEvent) => {
		if (!this.enabled) return
		if (this.preventDefault) event.preventDefault()
		if (!this.active) return

		this.active = false
	}

	dispose() {
		this.cancel()
		this.eventTarget?.removeEventListener('blur', this.cancel as EventListener)
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

		if (this.eventTarget instanceof HTMLElement) {
			this.eventTargetWidth = () => (this.eventTarget as HTMLElement)?.clientWidth
			this.eventTargetHeight = () => (this.eventTarget as HTMLElement)?.clientHeight
			return target
		}

		throw error
	}
}
