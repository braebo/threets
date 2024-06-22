import { LinkedListener } from './Listener'
import {
	isNumber,
	// Log
} from './utils'

export type Vec3 = { x: number; y: number; z: number }
export type Vector3Like = number | Partial<Vec3> | Vector3

export function isVector3(thing: any): thing is Vector3 {
	return thing && thing.type === 'Vector3'
}

// @Log('Vector3', ['get', 'toJSON'])
export class Vector3 {
	readonly isVector3 = true as const
	private _x = 0
	private _y = 0
	private _z = 0

	constructor(xOrVec3?: Vector3Like, y?: number, z?: number) {
		xOrVec3 ??= 0
		if (isNumber(xOrVec3)) {
			this._x = xOrVec3
			this._y = y ?? this._x
			this._z = z ?? this._y
		} else {
			this._x = xOrVec3.x ?? 0
			this._y = xOrVec3.y ?? this._x
			this._z = xOrVec3.z ?? this._y
		}
	}

	get x() {
		return this._x
	}
	set x(value: number) {
		this._x = value
	}

	get y() {
		return this._y
	}
	set y(value: number) {
		this._y = value
	}

	get z() {
		return this._z
	}
	set z(value: number) {
		this._z = value
	}

	/**
	 * Returns this vector as a new plain `{x,y,z}` {@link Vec3} object.
	 */
	get(): Vec3 {
		return this.toJSON()
	}
	/**
	 * Sets the values of this vector.
	 */
	set(vec3: Partial<Vec3>): this {
		this._x = vec3.x ?? this._x
		this._y = vec3.y ?? this._y
		this._z = vec3.z ?? this._z
		return this
	}

	/**
	 * Copies the provided vector's values onto this vector.
	 */
	copy(vec: Vector3): this {
		this._x = vec._x
		this._y = vec._y
		this._z = vec._z
		return this
	}

	/**
	 * Sets the values of this vector's {@link x}, {@link y}, and {@link z} components.
	 */
	setXYZ(x: number, y: number, z: number): this {
		this._x = x
		this._y = y
		this._z = z
		return this
	}

	/**
	 * Updates this vector by adding `inputVector`.
	 */
	add(vec: Vector3): Vector3 {
		this._x += vec._x
		this._y += vec._y
		this._z += vec._z
		return this
	}

	/**
	 * Updates this vector by subtracting `inputVector`.
	 */
	subtract(inputVector: Vector3): Vector3 {
		this._x -= inputVector._x
		this._y -= inputVector._y
		this._z -= inputVector._z
		return this
	}

	/**
	 * Updates this vector by multiplying `inputVector`.
	 */
	multiply(vec: Vector3): Vector3 {
		this._x *= vec._x
		this._y *= vec._y
		this._z *= vec._z
		return this
	}

	/**
	 * Updates this vector by multiplying by `scalar`.
	 */
	multiplyScalar(scalar: number): Vector3 {
		this._x *= scalar
		this._y *= scalar
		this._z *= scalar
		return this
	}

	/**
	 * Updates this vector by dividing by `inputVector`.
	 */
	divide(vec: Vector3): Vector3 {
		this._x /= vec._x
		this._y /= vec._y
		this._z /= vec._z
		return this
	}

	/**
	 * Calculates the dot product with another vector.
	 */
	dot(v: Vector3): number {
		return this._x * v._x + this._y * v._y + this._z * v._z
	}

	/**
	 * Calculates the cross product with another vector and stores the result in this vector.
	 */
	cross(v: Vector3): this {
		const ax = this._x,
			ay = this._y,
			az = this._z
		const bx = v._x,
			by = v._y,
			bz = v._z

		this._x = ay * bz - az * by
		this._y = az * bx - ax * bz
		this._z = ax * by - ay * bx

		return this
	}

	/**
	 * Normalizes this vector (makes it a unit vector).
	 */
	normalize(): this {
		const length = Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z)
		if (length > 0) {
			this._x /= length
			this._y /= length
			this._z /= length
		}
		return this
	}

	/**
	 * Calculates the length of this vector, returning the result.
	 */
	length(): number {
		return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z)
	}

	/**
	 * An array representation of this vector.
	 */
	toArray(): [number, number, number] {
		return [this._x, this._y, this._z]
	}
	toJSON(): Vec3 {
		return { x: this._x, y: this._y, z: this._z }
	}

	/**
	 * Notifies all {@link subscribe|subscribers}.
	 */
	update(): this {
		this._emit()
		return this
	}

	/**
	 * Takes a callback to run whenever {@link x}, {@link y}, or {@link z} change.  Calling this
	 * method multiple times will result in multiple callbacks being run.
	 * @returns An unsubscribe function.
	 */
	subscribe(callback: (vector: Vector3) => void): () => void {
		this._listeners ??= new LinkedListener(callback)
		this._listeners.add(callback)
		return this._listeners.disconnect
	}
	private _listeners: LinkedListener<Vector3> | null = null
	private _next: LinkedListener<Vector3> | null = null
	private _emit() {
		this._next = this._listeners
		while (this._next) {
			this._next = this._next.emit(this)
		}
	}
}
