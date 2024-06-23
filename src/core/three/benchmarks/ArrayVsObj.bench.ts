import { describe } from 'vitest'
describe.todo('Array vs Object benchmarks', () => {})

// import { bench, describe } from 'vitest'

// const bodyCount = 1000

// let vectorSum: Vector
// let arraySum: number[]
// let chunkSum: number[]

// class Vector {
// 	constructor(
// 		public x: number,
// 		public y: number,
// 		public z: number,
// 	) {}

// 	add(other: Vector): void {
// 		this.x += other.x
// 		this.y += other.y
// 		this.z += other.z
// 	}
// }

// function addArrays(a: number[], b: number[]): void {
// 	a[0] += b[0]
// 	a[1] += b[1]
// 	a[2] += b[2]
// }

// function addArrayFromChunk(out: number[], input: number[], index: number): void {
// 	out[0] += input[index + 0]
// 	out[1] += input[index + 1]
// 	out[2] += input[index + 2]
// }

// describe('Vector sum benchmarks', () => {
// 	bench('Compute sum with Vector(x, y, z)', () => {
// 		const vectors: Vector[] = []
// 		for (let i = 0; i < bodyCount; ++i) {
// 			vectors.push(new Vector(i, i, i))
// 		}

// 		const sum = new Vector(0, 0, 0)
// 		for (let i = 0; i < bodyCount; ++i) {
// 			sum.add(vectors[i])
// 		}

// 		vectorSum = sum
// 	})

// 	bench('Compute sum with array[x, y, z]', () => {
// 		const vectors: number[][] = []
// 		for (let i = 0; i < bodyCount; ++i) {
// 			vectors.push([i, i, i])
// 		}

// 		const sum = [0, 0, 0]
// 		for (let i = 0; i < bodyCount; ++i) {
// 			addArrays(sum, vectors[i])
// 		}

// 		arraySum = sum
// 	})

// 	bench('Compute sum with huge chunk', () => {
// 		const vectors: number[] = []
// 		for (let i = 0; i < bodyCount; ++i) {
// 			vectors.push(i, i, i)
// 		}

// 		const sum = [0, 0, 0]
// 		for (let i = 0; i < bodyCount * 3; i += 3) {
// 			addArrayFromChunk(sum, vectors, i)
// 		}

// 		chunkSum = sum
// 	})
// })
