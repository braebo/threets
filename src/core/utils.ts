import type { Vec3 } from './vectors'

export type QuerySelector = `#${string}` | `.${string}` | string

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
	return typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector
}
