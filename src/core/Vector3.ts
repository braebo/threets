import { isNumber, Log } from './utils'

export type Vec3 = { x: number; y: number; z: number }
export type Vector3Like = Partial<Vec3> | [number, number, number] | number

export function isVector3(thing: any): thing is Vector3 {
	return thing && thing.type === 'Vector3'
}

@Log('Vector3', ['get', 'toJSON'])
export class Vector3 {
	readonly __type = 'Vector3' as const
	_x = 0
	_y = 0
	_z = 0

	constructor(xOrVec3Like?: Vector3Like, y?: number, z?: number) {
		xOrVec3Like ??= 0
		this.set(xOrVec3Like ?? 0, y, z)
	}

	get x() {
		return this._x
	}
	get y() {
		return this._y
	}
	get z() {
		return this._z
	}

	/**
	 * Returns this vector as a new plain {@link Vec3} object.
	 */
	get(): Vec3 {
		return this.toJSON()
	}
	/**
	 * Sets the values of this vector from the provided {@link Vector3Like}, which can be:
	 * - #### ( x, y?, z? )
	 *   - If just `x` is provided, `y` and `z` will fallback to `x`.
	 * - #### { x?, y?, z? }
	 *   - This is a partial {@link Vec3}, and only the provided properties will be set.
	 * - #### [ x, y, z ]
	 *   - All 3 values must be provided in an array.
	 * - #### {@link Vector3}
	 *   - Passing a whole vector is a less efficient than just using {@link Vector3.copy}
	 */
	set(xOrVec3Like: Vector3Like, y?: number, z?: number): this {
		if (Array.isArray(xOrVec3Like)) {
			this._x = xOrVec3Like[0]
			this._y = xOrVec3Like[1]
			this._z = xOrVec3Like[2]
		} else if (typeof xOrVec3Like === 'object') {
			if (isVector3(xOrVec3Like)) {
				this.copy(xOrVec3Like)
			} else {
				if (isNumber(xOrVec3Like.x)) this._x = xOrVec3Like.x
				if (isNumber(xOrVec3Like.y)) this._y = xOrVec3Like.y
				if (isNumber(xOrVec3Like.z)) this._z = xOrVec3Like.z
			}
		} else if (typeof xOrVec3Like === 'string') {
			if (xOrVec3Like === 'x') this._x = y!
			if (xOrVec3Like === 'y') this._y = y!
			if (xOrVec3Like === 'z') this._z
		} else {
			this._x = xOrVec3Like ?? 1
			this._y = y ?? this.x
			this._z = z ?? this.y ?? this.x
		}
		return this
	}

	/**
	 * Copies the provided vector's values onto this vector.
	 */
	copy(vec: Vector3): this {
		this._x = vec.x
		this._y = vec.y
		this._z = vec.z
		return this
	}

	/**
	 * Fastest way to set {@link x}.
	 */
	setX(value: number): this {
		this._x = value
		return this
	}

	/**
	 * Fastest way to set {@link y}.
	 */
	setY(value: number): this {
		this._y = value
		return this
	}

	/**
	 * Fastest way to set {@link z}.
	 */
	setZ(value: number): this {
		this._z = value
		return this
	}

	/**
	 * Updates this vector by adding `inputVector`.
	 */
	add(vec: Vector3): Vector3 {
		this._x += vec.x
		this._y += vec.y
		this._z += vec.z
		return this
	}
	/**
	 * Updates this vector by subtracting `inputVector`.
	 */
	subtract(inputVector: Vector3): Vector3 {
		this._x -= inputVector.x
		this._y -= inputVector.y
		this._z -= inputVector.z
		return this
	}
	/**
	 * Updates this vector by multiplying `inputVector`.
	 */
	multiply(vec: Vector3): Vector3 {
		this._x *= vec.x
		this._y *= vec.y
		this._z *= vec.z
		return this
	}
	/**
	 * Updates this vector by dividing by `inputVector`.
	 */
	divide(vec: Vector3): Vector3 {
		this._x /= vec.x
		this._y /= vec.y
		this._z /= vec.z
		return this
	}

	/**
	 * An array representation of this vector.
	 */
	toArray(): [number, number, number] {
		return [this.x, this.y, this.z]
	}
	toJSON() {
		return { x: this.x, y: this.y, z: this.z }
	}
}
