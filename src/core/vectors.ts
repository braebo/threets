import { Log } from './utils'

export type Vec2 = { x: number; y: number }
export type Vec3 = { x: number; y: number; z: number }
export type Vector3Like = Partial<Vec3> | [number, number, number] | number

export function isVector3(obj: any): obj is Vector3 {
	return !!obj.isVector3
}

function isNumber(n: any): n is number {
	return typeof n === 'number' && !isNaN(n)
}

@Log('Vector3')
export class Vector3 {
	readonly isVector3 = true as const
	_x = 0
	_y = 0
	_z = 0

	constructor(vec3Like: Vector3Like)
	constructor(x: number, y?: number, z?: number)
	constructor(
		xOrArrOrObj?: number | [number, number, number] | Partial<Vec3>,
		y?: number,
		z?: number,
	) {
		// @ts-expect-error
		this.set(xOrArrOrObj ?? 0, y, z)
	}

	get(): Vec3 {
		return { x: this.x, y: this.y, z: this.z }
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

	set(value: Vector3Like): this
	set(x: number, y?: number, z?: number): this
	set(xOrVec3Like: Vector3Like | number, y?: number, z?: number): this {
		if (Array.isArray(xOrVec3Like)) {
			this._x = xOrVec3Like[0]
			this._y = xOrVec3Like[1]
			this._z = xOrVec3Like[2]
		} else if (typeof xOrVec3Like === 'object') {
			if (isNumber(xOrVec3Like.x)) this._x = xOrVec3Like.x
			if (isNumber(xOrVec3Like.y)) this._y = xOrVec3Like.y
			if (isNumber(xOrVec3Like.z)) this._z = xOrVec3Like.z
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

	setX(value: number): this {
		this._x = value
		return this
	}
	setY(value: number): this {
		this._y = value
		return this
	}
	setZ(value: number): this {
		this._z = value
		return this
	}

	toArray(): [number, number, number] {
		return [this.x, this.y, this.z]
	}

	toObject(): Vec3 {
		return this.get()
	}

	toJSON() {
		return this.get()
	}
}
