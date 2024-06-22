import { LinkedListener } from './Listener'
import {
	isNumber,
	// Log
} from './utils'

export type Vec2 = { x: number; y: number }
export type Vector2Like = number | Partial<Vec2> | Vector2

export function isVector2(thing: any): thing is Vector2 {
	return thing && thing.type === 'Vector2'
}

// @Log('Vector2', ['get', 'toJSON'])
export class Vector2 {
	readonly isVector2 = true as const
	private _x = 0
	private _y = 0

	constructor(xOrVec2?: number | Partial<Vec2> | Vector2, y?: number) {
		xOrVec2 ??= 0
		if (isNumber(xOrVec2)) {
			this._x = xOrVec2
			this._y = y ?? this._x
		} else {
			this._x = xOrVec2.x ?? 0
			this._y = xOrVec2.y ?? this._x
		}
	}

	get x() {
		return this._x
	}
	set x(value: number) {
		this._x = value
		this._emit()
	}

	get y() {
		return this._y
	}
	set y(value: number) {
		this._y = value
		this._emit()
	}

	/**
	 * Returns this vector as a new plain `{x,y}` {@link Vec2} object.
	 */
	get(): Vec2 {
		return this.toJSON()
	}
	/**
	 * Sets the values of this vector.
	 */
	set(vec2: Partial<Vec2>): this {
		this._x = vec2.x ?? this._x
		this._y = vec2.y ?? this._y
		this._emit()
		return this
	}

	/**
	 * Copies the provided vector's values onto this vector.
	 */
	copy(vec: Vector2): this {
		this._x = vec._x
		this._y = vec._y
		this._emit()
		return this
	}

	/**
	 * Sets the values of this vector's {@link x} and {@link y} components.
	 */
	setXY(x: number, y: number): this {
		this._x = x
		this._y = y
		this._emit()
		return this
	}

	/**
	 * Updates this vector by adding `inputVector`.
	 */
	add(vec: Vector2): Vector2 {
		this._x += vec._x
		this._y += vec._y
		this._emit()
		return this
	}

	/**
	 * Updates this vector by subtracting `inputVector`.
	 */
	subtract(inputVector: Vector2): Vector2 {
		this._x -= inputVector._x
		this._y -= inputVector._y
		this._emit()
		return this
	}

	/**
	 * Updates this vector by multiplying `inputVector`.
	 */
	multiply(vec: Vector2): Vector2 {
		this._x *= vec._x
		this._y *= vec._y
		this._emit()
		return this
	}

	/**
	 * Updates this vector by multiplying by `scalar`.
	 */
	multiplyScalar(scalar: number): Vector2 {
		this._x *= scalar
		this._y *= scalar
		this._emit()
		return this
	}

	/**
	 * Updates this vector by dividing by `inputVector`.
	 */
	divide(vec: Vector2): Vector2 {
		this._x /= vec._x
		this._y /= vec._y
		this._emit()
		return this
	}

	/**
	 * Calculates the dot product with another vector.
	 */
	dot(v: Vector2): number {
		return this._x * v._x + this._y * v._y
	}

	/**
	 * Normalizes this vector (makes it a unit vector).
	 */
	normalize(): this {
		const length = Math.sqrt(this._x * this._x + this._y * this._y)
		if (length > 0) {
			this._x /= length
			this._y /= length
		}
		this._emit()
		return this
	}

	/**
	 * Calculates the length of this vector, returning the result.
	 */
	length(): number {
		return Math.sqrt(this._x * this._x + this._y * this._y)
	}

	/**
	 * An array representation of this vector.
	 */
	toArray(): [number, number] {
		return [this._x, this._y]
	}
	toJSON() {
		return { x: this._x, y: this._y }
	}

	/**
	 * Takes a callback to run whenever {@link x} or {@link y} change.  Calling this
	 * method multiple times will result in multiple callbacks being run.
	 */
	onChange(callback: (vector: Vector2) => void) {
		this._listeners ??= new LinkedListener(callback)
		this._listeners.add(callback)
	}
	private _listeners: LinkedListener<[Vector2]> | null = null
	private _next: LinkedListener<[Vector2]> | null = null
	private _emit() {
		this._next = this._listeners
		while (this._next) {
			this._next = this._next.emit(this)
		}
	}
}

// import { isNumber, Log } from './utils'

// export type Vec2 = { x: number; y: number }
// export type Vector2Like = Partial<Vec2> | [number, number] | number

// export function isVector2(thing: any): thing is Vector2 {
// 	return thing && thing.type === 'Vector2'
// }

// // @Log('Vector2', ['get', 'toJSON'])
// export class Vector2 {
// 	readonly __type = 'Vector2' as const
// 	_x = 0
// 	_y = 0

// 	constructor(xOrVec2Like?: Vector2Like, y?: number) {
// 		xOrVec2Like ??= 0
// 		this.set(xOrVec2Like, y)
// 	}

// 	get x() {
// 		return this._x
// 	}
// 	get y() {
// 		return this._y
// 	}

// 	get(): Vec2 {
// 		return { x: this.x, y: this.y }
// 	}
// 	set(xOrVec2Like: Vector2Like, y?: number): this {
// 		if (Array.isArray(xOrVec2Like)) {
// 			this._x = xOrVec2Like[0]
// 			this._y = xOrVec2Like[1]
// 		} else if (typeof xOrVec2Like === 'object') {
// 			if (isNumber(xOrVec2Like.x)) this._x = xOrVec2Like.x
// 			if (isNumber(xOrVec2Like.y)) this._y = xOrVec2Like.y
// 		} else if (typeof xOrVec2Like === 'string') {
// 			if (xOrVec2Like === 'x') this._x = y!
// 			if (xOrVec2Like === 'y') this._y = y!
// 		} else {
// 			this._x = xOrVec2Like ?? 1
// 			this._y = y ?? this.x
// 		}
// 		return this
// 	}

// 	setX(value: number): this {
// 		this._x = value
// 		return this
// 	}
// 	setY(value: number): this {
// 		this._y = value
// 		return this
// 	}

// 	toArray(): [number, number] {
// 		return [this.x, this.y]
// 	}
// 	toObject(): Vec2 {
// 		return this.get()
// 	}
// 	toJSON() {
// 		return this.get()
// 	}
// }
