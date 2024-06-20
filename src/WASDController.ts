import type { Stage } from './core/Stage'
// import { Log } from './core/utils'

export type WASDCommand = (typeof WASD_COMMANDS)[number]
export const WASD_COMMANDS = ['w', 'a', 's', 'd', 'q', 'e', 'shift', 'control', 'escape'] as const

export interface WASDControllerOptions {
	/**
	 * The event listener target.
	 * @default 'window'
	 */
	eventTarget?: 'window' | 'canvas'
	/**
	 * Automatically initialize the controls, adding event listeners to the {@link eventTarget}.
	 * @default true
	 */
	autoInit?: boolean
	/**
	 * Automatically call {@link update} when a control is activated or deactivated.
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
// @Log('OrbitControls')
export class WASDController {
	initialized = false
	autoUpdate = true

	_target!: Window | HTMLCanvasElement
	capturePointerLock: boolean
	enabled: boolean
	_speedMultiplier = 1
	private _speed: number
	get speed() {
		return this._speed * this._speedMultiplier
	}

	/**
	 * Whether any control is currently active.
	 */
	active = false

	state: Record<WASDCommand, boolean> = {
		w: false,
		a: false,
		s: false,
		d: false,
		q: false,
		e: false,
		shift: false,
		control: false,
		escape: false,
	}

	get transform() {
		return this.stage.camera.transform
	}

	private moveset = {
		w: () => {
			this.transform.position.setZ(this.transform.position.z + this.speed)
		},
		a: () => {
			this.transform.position.setX(this.transform.position.x - this.speed)
		},
		s: () => {
			this.transform.position.setZ(this.transform.position.z - this.speed)
		},
		d: () => {
			this.transform.position.setX(this.transform.position.x + this.speed)
		},
		q: () => {
			this.transform.position.setY(this.transform.position.y - this.speed)
		},
		e: () => {
			this.transform.position.setY(this.transform.position.y + this.speed)
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
	} as const satisfies Record<WASDCommand, () => void>

	/**
	 * All active {@link moveset} callbacks queued for the next {@link update}.
	 */
	private moves: WASDCommand[] = []

	constructor(public stage: Stage, options?: WASDControllerOptions) {
		this.target = options?.eventTarget ?? 'window'
		this.capturePointerLock = options?.capturePointerLock ?? false
		this.enabled = options?.enabled ?? true
		this._speed = options?.speed ?? 1

		if (options?.autoInit ?? true) {
			this.init()
		}
	}

	get target(): Window | HTMLCanvasElement {
		return this._target
	}
	set target(value: WASDControllerOptions['eventTarget']) {
		this._target = value === 'canvas' ? this.stage.canvas : globalThis.window
	}

	/**
	 * Initialize the controls, adding event listeners to the {@link target}.
	 */
	init() {
		if (this.initialized) return
		this.initialized = true
		this.target.addEventListener('keydown', this.onKeyDown as EventListener)
		this.target.addEventListener('keyup', this.onKeyUp as EventListener)
		this.target.addEventListener('blur', this.cancel)

		if (this.stage && (this.autoUpdate ?? true)) {
			this.update()
		}
	}

	/**
	 * Cancel all active {@link moves} and reset {@link state}.
	 */
	cancel = () => {
		this.active = false
		this.moves = []
		this.state = {
			w: false,
			a: false,
			s: false,
			d: false,
			q: false,
			e: false,
			shift: false,
			control: false,
			escape: false,
		}
		this._speedMultiplier = 1
		if (this.capturePointerLock) {
			document.exitPointerLock()
		}
	}

	/**
	 * Call active {@link moves}.
	 */
	update() {
		if (this.enabled && this.active) {
			for (let i = 0; i < this.moves.length; i++) {
				this.moveset[this.moves[i]]()
			}
			if (this.autoUpdate) {
				this.stage.camera.transform.update()
			}
		}
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
			this._speedMultiplier = this.state.control ? 0.5 : 1
		} else if (key === 'control') {
			this._speedMultiplier = this.state.shift ? 2 : 1
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

		if (WASD_COMMANDS.includes(key)) {
			this._activate(key)
		} else {
			console.warn('key down:', key, 'not matched')
		}
	}

	onKeyUp = (event: KeyboardEvent) => {
		if (!this.enabled) return
		const key = event.key.toLowerCase() as WASDCommand

		if (WASD_COMMANDS.includes(key)) {
			this._deactivate(key)
		} else {
			console.warn('key up:', key, 'not matched')
		}
	}

	dispose() {
		this.cancel()
		this.target.removeEventListener('blur', this.cancel as EventListener)
	}
}
