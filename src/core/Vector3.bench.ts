/**
 * @fileoverview
 * Benchmarking object vs array vector performance.
 *
 * Results: TIE
 *
 * This might also just be a bad benchmark.
 */

import { bench } from 'vitest'

type Vec3 = { x: number; y: number; z: number }

const vecA = { x: 1, y: 2, z: 3 }
const vecB = { x: 4, y: 5, z: 6 }

const vecArrA: [number, number, number] = [1, 2, 3]
const vecArrB: [number, number, number] = [4, 5, 6]

bench('cross (object)', () => {
	cross(vecA, vecB)
})

bench('cross (array)', () => {
	cross_arr(vecArrA, vecArrB)
})

function cross(a: Vec3, b: Vec3) {
	return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }
}

function cross_arr(a: number[], b: number[]) {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
