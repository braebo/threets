import type { QuerySelector } from './types'
import type { Vec3 } from './Vector3'

import { DEV } from 'esm-env'

/**
 * Converts radians to degrees.
 */
export function radToDeg(r: number) {
	return (r * 180) / Math.PI
}

/**
 * Converts degrees to radians.
 */
export function degToRad(d: number) {
	return (d * Math.PI) / 180
}

export function subtractVectors(a: Vec3, b: Vec3) {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function normalize(v: Vec3) {
	var length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		return { x: v.x / length, y: v.y / length, z: v.z / length }
	} else {
		return { x: 0, y: 0, z: 0 }
	}
}

export function cross(a: Vec3, b: Vec3) {
	return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }
}

export function cross_arr(a: number[], b: number[]) {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

export function select(elementOrSelector?: QuerySelector | Element) {
	return typeof elementOrSelector === 'string'
		? document.querySelector(elementOrSelector)
		: elementOrSelector
}

export function isNumber(thing: any): thing is number {
	return typeof thing === 'number' && !isNaN(thing)
}

const hexColorHash = (name: string): string =>
	'#' +
	(0x1000000 + (name.split('').reduce((acc, c) => acc + c.charCodeAt(0) * 42, 0) & 0xffffff))
		.toString(16)
		.slice(1)
		.replace(/^./, 'F')

type LogOptions =
	| {
			exclude?: string[]
			include?: never
	  }
	| {
			exclude?: never
			include?: string[]
	  }

/**
 * Dev-time logging of class method calls.
 */
export function Log(
	id: string,
	{ exclude = [], include = undefined } = {} as LogOptions,
): ClassDecorator {
	return function (target: Function) {
		for (const key of Object.getOwnPropertyNames(target.prototype)) {
			if (key === 'constructor') continue

			const descriptor = Object.getOwnPropertyDescriptor(target.prototype, key)
			if (!descriptor) continue

			if (typeof descriptor.value === 'function') {
				const originalMethod = descriptor.value
				descriptor.value = function (...args: any[]) {
					if (
						DEV &&
						!(include?.length && include.includes(key)) &&
						!exclude.includes(key)
					) {
						const color = hexColorHash(key)
						console.log(
							`%c${id} : ${key}%c()`,
							`color:${color}`,
							`color:inherit`,
							...args,
							{
								this: this,
							},
						)
					}
					return originalMethod.apply(this, args)
				}
			}

			// if (typeof descriptor.get === 'function') {
			// 	const getter = descriptor.get
			// 	descriptor.get = function () {
			// 		if (DEV && !blacklist.includes(key)) {
			// 			const color = hexColorHash(key)
			// 			console.log(
			// 				`%c${id} %cget %c${key}%c`,
			// 				`color:${color}`,
			// 				`color:grey`,
			// 				`color:${color}`,
			// 				`color:inherit`,
			// 				{
			// 					this: this,
			// 				},
			// 			)
			// 		}
			// 		return getter!.call(this)
			// 	}
			// }

			if (typeof descriptor.set === 'function') {
				const setter = descriptor.set
				descriptor.set = function (value: any) {
					if (DEV && !exclude.includes(key)) {
						const color = hexColorHash(key)
						console.log(
							`%c${id} : %cset %c${key}%c =`,
							`color:${color}`,
							`color:grey`,
							`color:${color}`,
							`color:inherit`,
							value,
							{
								this: this,
							},
						)
					}
					return setter!.call(this, value)
				}
			}

			Object.defineProperty(target.prototype, key, descriptor)
		}
	}
}
// export function Log(id: string, blacklist = [] as string[]): ClassDecorator {
// 	return function (target: Function) {
// 		for (const key of Object.getOwnPropertyNames(target.prototype)) {
// 			console.log(key)
// 			const method = target.prototype[key] // If this is a `getter` _and_ the initial construction phase, this crashes the app with: "Cannot read properties of undefined..."
// 			if (key !== 'constructor' && typeof method === 'function') {
// 				const color = hexColorHash(key)
// 				target.prototype[key] = function (...args: any[]) {
// 					if (DEV && !blacklist.includes(key)) {
// 						console.log(
// 							`%c${id} : ${key}%c()`,
// 							`color:${color}`,
// 							`color:inherit`,
// 							...args,
// 							{
// 								this: this,
// 							},
// 						)
// 					}
// 					return method.apply(this, args)
// 				}
// 			}
// 		}
// 	}
// }
