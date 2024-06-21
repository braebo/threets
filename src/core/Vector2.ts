import { isNumber, Log } from './utils'

export type Vec2 = { x: number; y: number }
export type Vector2Like = Partial<Vec2> | [number, number] | number

export function isVector2(thing: any): thing is Vector2 {
	return thing && thing.type === 'Vector2'
}

@Log('Vector2', ['get', 'toJSON'])
export class Vector2 {
	readonly __type = 'Vector2' as const
	_x = 0
	_y = 0

	constructor(xOrVec2Like?: Vector2Like, y?: number) {
		xOrVec2Like ??= 0
		this.set(xOrVec2Like, y)
	}

	get x() {
		return this._x
	}
	get y() {
		return this._y
	}

	get(): Vec2 {
		return { x: this.x, y: this.y }
	}
	set(xOrVec2Like: Vector2Like, y?: number): this {
		if (Array.isArray(xOrVec2Like)) {
			this._x = xOrVec2Like[0]
			this._y = xOrVec2Like[1]
		} else if (typeof xOrVec2Like === 'object') {
			if (isNumber(xOrVec2Like.x)) this._x = xOrVec2Like.x
			if (isNumber(xOrVec2Like.y)) this._y = xOrVec2Like.y
		} else if (typeof xOrVec2Like === 'string') {
			if (xOrVec2Like === 'x') this._x = y!
			if (xOrVec2Like === 'y') this._y = y!
		} else {
			this._x = xOrVec2Like ?? 1
			this._y = y ?? this.x
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

	toArray(): [number, number] {
		return [this.x, this.y]
	}
	toObject(): Vec2 {
		return this.get()
	}
	toJSON() {
		return this.get()
	}
}
