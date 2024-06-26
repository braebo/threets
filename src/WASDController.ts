import { DEV } from 'esm-env'
import type { Camera } from './core/Camera'
import type { Stage } from './core/Stage'
import { select } from './core/utils'
import { Vector3 } from './core/Vector3'
// import { Log } from './core/utils'

const DEFAULT_STATE = Object.freeze({
	w: false,
	a: false,
	s: false,
	d: false,
	q: false,
	e: false,
	shift: false,
	control: false,
	escape: false,
	arrowup: false,
	arrowdown: false,
	arrowleft: false,
	arrowright: false,
} as const)

export type WASDCommand = (typeof WASD_COMMANDS)[number]
export const WASD_COMMANDS = Object.keys(DEFAULT_STATE) as Array<keyof typeof DEFAULT_STATE>

export interface WASDControllerOptions {
	/**
	 * Enables only specific commands in the controller while excluding all others.
	 */
	include?: WASDCommand[]
	/**
	 * Exclude specific commands from the controller. These will also be filtered out of the
	 * {@link include} array provided.
	 */
	exclude?: WASDCommand[]
	/**
	 * The base speed of the controller.
	 * @default 1
	 */
	speed?: number
	/**
	 * Automatically initialize the controls, adding event listeners to the {@link eventTarget}.
	 * @default true
	 */
	autoInit?: boolean
	/**
	 * Automatically call {@link update} when a control is activated or deactivated.
	 * @todo - this may not be necessary anymore
	 * @default true
	 */
	autoUpdate?: boolean
	/**
	 * Whether the arrow keys should control rotation.
	 * @default false
	 */
	useRotation?: boolean
	/**
	 * Whether to call {@link Event.preventDefault} on keydown events.
	 * @default true
	 */
	preventDefault?: boolean
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
	 * The event listener target or query selector.  The string `'window'` will resolve to
	 * {@link globalThis.window} when {@link WASDController.init|init} is called.
	 */
	domElement?: Window | HTMLElement | string | 'window'
}

/**
 * A simple WASD keyboard controller.
 *
 * - wasd - forwards left backwards right
 * - qe - up down
 * - shift - speed * 2
 * - control - speed / 2
 *
 * @example
 * ```ts
 * const stage = new Stage()
 * const controls = new WASDControls(stage)
 *
 * // You can also set the speed yourself:
 * controls.speed = 0.1
 * ```
 */
// @Log('OrbitControls', { exclude: [''] })
export class WASDController {
	initialized = false

	enabled = true
	autoUpdate = true
	useRotation = false
	state: Record<WASDCommand, boolean> = structuredClone(DEFAULT_STATE)
	/**
	 * Whether any control is currently active.
	 */
	active = false
	dirty = true
	capturePointerLock = false
	preventDefault = true

	private _speed = 1
	_speedMultiplier = 1

	private moveset = {
		w: () => {
			this.position.z = this.position.z - this.speed
		},
		a: () => {
			this.position.x = this.position.x - this.speed
		},
		s: () => {
			this.position.z = this.position.z + this.speed
		},
		d: () => {
			this.position.x = this.position.x + this.speed
		},
		q: () => {
			this.position.y = this.position.y - this.speed
		},
		e: () => {
			this.position.y = this.position.y + this.speed
		},
		shift: () => {
			this._speedMultiplier = 2
		},
		control: () => {
			this._speedMultiplier = 0.5
		},
		escape: () => {
			this.cancel()
		},
		arrowup: () => {
			this.rotation.x = this.rotation.x - 0.1
		},
		arrowdown: () => {
			this.rotation.x = this.rotation.x + 0.1
		},
		arrowleft: () => {
			this.rotation.y = this.rotation.y - 0.1
		},
		arrowright: () => {
			this.rotation.y = this.rotation.y + 0.1
		},
	} as const satisfies Record<WASDCommand, () => void>

	/**
	 * All active {@link moveset} callbacks queued for the next {@link update}.
	 */
	private moves: WASDCommand[] = []

	domElement = 'window' as any as Window | HTMLElement
	position = new Vector3()
	rotation = new Vector3()

	legalMoves: Set<WASDCommand>

	constructor(
		public stage: Stage,
		options?: WASDControllerOptions,
	) {
		stage.camera.controllers.wasd = this

		if (options?.speed) this._speed = options.speed
		if (options?.autoUpdate) this.autoUpdate = options.autoUpdate
		if (options?.enabled) this.enabled = options.enabled
		if (options?.useRotation) this.useRotation = options?.useRotation
		if (options?.preventDefault) this.preventDefault = options.preventDefault
		if (options?.capturePointerLock) this.capturePointerLock = options.capturePointerLock
		if (options?.domElement) this.domElement = options.domElement as Window | HTMLElement

		this.legalMoves = new Set(options?.include ?? WASD_COMMANDS)
		if (options?.exclude) {
			this.legalMoves = this.legalMoves.difference(new Set(options.exclude))
		}

		if (options?.autoInit ?? true) this.init()
	}

	get speed() {
		return this._speed * this._speedMultiplier
	}

	/**
	 * Initialize the controls, adding event listeners to the {@link target}.
	 */
	init() {
		if (this.initialized) return
		this.initialized = true

		// Resolve the event target.
		if (typeof this.domElement === 'string') {
			this.domElement =
				this.domElement === 'window' ? globalThis.window : select(this.domElement)
		}

		this.domElement.addEventListener('keydown', this.onKeyDown as EventListener)
		this.domElement.addEventListener('keyup', this.onKeyUp as EventListener)

		this.position.copy(this.stage.camera.position)
		this.rotation.copy(this.stage.camera.rotation)

		if (this.autoUpdate) this.update()
	}

	/**
	 * Cancel all active {@link moves} and reset {@link state}.
	 */
	cancel = () => {
		this.active = false
		this.moves = []
		this.state = structuredClone(DEFAULT_STATE)
		this._speedMultiplier = 1
		if (this.capturePointerLock) {
			document.exitPointerLock()
		}
	}

	/**
	 * Run all active {@link moves}.
	 * @returns `false` if the controller is disabled or inactive, otherwise `true`.
	 */
	update(): boolean {
		if (!this.enabled) return false
		if (!this.active && !this.dirty) return false

		for (let i = 0; i < this.moves.length; i++) {
			this.moveset[this.moves[i]]()
		}
		this.dirty = true
		if (this.autoUpdate) {
			this.stage.camera.update()
		}
		return true
	}

	apply(camera: Camera) {
		camera.position.set(this.position)
		if (this.useRotation) {
			camera.rotation.set(this.rotation)
		}
		camera.rotation.set(this.rotation)
	}

	private _activate(key: WASDCommand) {
		if (this.state[key]) {
			return
		}
		this.state[key] = true
		this.moves.push(key)
		this.updateActive()
	}

	private _deactivate(key: WASDCommand) {
		if (!this.state[key]) {
			return
		}
		this.state[key] = false
		this.moves = this.moves.filter(move => move !== key)

		if (key === 'shift') {
			this._speedMultiplier = this.state['control'] ? 0.5 : 1
		} else if (key === 'control') {
			this._speedMultiplier = this.state['shift'] ? 2 : 1
		}

		this.updateActive()
	}

	updateActive() {
		const newActiveState = Object.values(this.state).some(Boolean)
		if (newActiveState === this.active) {
			return
		}
		if (newActiveState) {
			if (!this.active) {
				this.active = true
				if (this.capturePointerLock) {
					try {
						globalThis.document.body.requestPointerLock()
					} catch (error) {
						console.error('Error capturing pointer lock:', error)
						this.capturePointerLock = false
					}
				}
			}
		} else {
			this.active = false
			this.cancel()
		}
		if (this.autoUpdate) {
			this.update()
		}
	}

	onKeyDown = (event: KeyboardEvent) => {
		if (!this.enabled) return

		const key = event.key.toLowerCase() as WASDCommand

		if (this.legalMoves.has(key)) {
			if (this.preventDefault) event.preventDefault()
			this._activate(key)
		} else if (DEV) {
			console.warn('key down:', key, 'not matched')
		}
	}

	onKeyUp = (event: KeyboardEvent) => {
		if (!this.enabled) return
		const key = event.key.toLowerCase() as WASDCommand

		if (this.legalMoves.has(key)) {
			if (this.preventDefault) event.preventDefault()
			this._deactivate(key)
		} else if (DEV) {
			console.warn('key up:', key, 'not matched')
		}
	}

	dispose() {
		this.cancel()
		this.domElement.removeEventListener('keydown', this.onKeyDown as EventListener)
		this.domElement.removeEventListener('keyup', this.onKeyUp as EventListener)
	}
}
