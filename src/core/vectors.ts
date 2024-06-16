export type Vec2 = { x: number; y: number }
export type Vec3 = { x: number; y: number; z: number }

export class Vector3 {
	x!: number
	y!: number
	z!: number

	constructor(x?: number, y?: number, z?: number)
	constructor(arr?: [number, number, number])
	constructor(obj?: Vec3)
	constructor(xOrArrOrObj?: number | [number, number, number] | Vec3, y?: number, z?: number) {
		// @ts-expect-error
		this.set(xOrArrOrObj, y, z)
	}

	get(): Vec3 {
		return { x: this.x, y: this.y, z: this.z }
	}

	set(x?: number, y?: number, z?: number): this
	set(arr?: [number, number, number]): this
	set(obj?: Vec3): this
	set(xOrArrOrObj?: number | [number, number, number] | Vec3, y?: number, z?: number): this {
		if (Array.isArray(xOrArrOrObj)) {
			this.x = xOrArrOrObj[0]
			this.y = xOrArrOrObj[1]
			this.z = xOrArrOrObj[2]
		} else if (typeof xOrArrOrObj === 'object') {
			const { x, y, z } = xOrArrOrObj
			this.x = x
			this.y = y
			this.z = z
		} else {
			this.x = xOrArrOrObj ?? 1
			this.y = y ?? this.x
			this.z = z ?? this.y ?? this.x
		}
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

// export class Vector3 {
// 	x: number
// 	y: number
// 	z: number

// 	constructor({ x, y, z }: Vec3)
// 	constructor(x?: number, y?: number, z?: number)
// 	constructor(x?: number | Vec3, y?: number, z?: number) {
// 		if (typeof x === 'object') ({ x, y, z } = x)
// 		this.x = x ?? 1
// 		this.y = y ?? this.x
// 		this.z = z ?? this.y ?? this.x
// 	}

// 	toArray(): [number, number, number] {
// 		return [this.x, this.y, this.z]
// 	}
// }

// export class Vector3_arr {
// 	x!: number
// 	y!: number
// 	z!: number

// 	constructor(x?: number, y?: number, z?: number)
// 	constructor(arr?: [number, number, number])
// 	constructor(xOrArr?: number | [number, number, number], y?: number, z?: number) {
// 		// @ts-expect-error
// 		this.set(xOrArr, y, z)
// 	}

// 	set(x?: number, y?: number, z?: number): this
// 	set(arr?: [number, number, number]): this
// 	set(xOrArr?: number | [number, number, number], y?: number, z?: number): this {
// 		if (Array.isArray(xOrArr)) {
// 			this.x = xOrArr[0]
// 			this.y = xOrArr[1]
// 			this.z = xOrArr[2]
// 		} else {
// 			this.x = xOrArr ?? 1
// 			this.y = y ?? this.x
// 			this.z = z ?? this.y ?? this.x
// 		}
// 		return this
// 	}

// 	toArray() {
// 		return [this.x, this.y, this.z]
// 	}

// 	toObject(): Vec3 {
// 		return { x: this.x, y: this.y, z: this.z }
// 	}

//     static fromArray(arr: [number, number, number]) {
//         return new Vector3_arr(arr)
//     }
// }
