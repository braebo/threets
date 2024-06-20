/**
 * An angle that stores its value in both radians and degrees. Set one, and the other is updated
 * automatically.
 * @example
 * ```ts
 * const angle = new Angle(90)
 * console.log(angle.radians) // 1.5707963267948966
 * 
 * angle.radians = Math.PI
 * console.log(angle.degrees) // 180
 * ```
 */
export class Angle {
	private _radians = 0
	private _degrees = 0

	constructor(degrees: number) {
		this.degrees = degrees
	}

	get radians() {
		return this._radians
	}
	set radians(value: number) {
		this._radians = value
		this._degrees = value * (180 / Math.PI)
	}

	get degrees() {
		return this._degrees
	}
	set degrees(value: number) {
		this._degrees = value
		this._radians = (value * Math.PI) / 180
	}
}
