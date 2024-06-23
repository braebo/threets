import { describe } from 'vitest'
describe.todo('Array vs Object benchmarks', () => {})

// import { bench, describe } from 'vitest'
// import { Vector3 as Vector3Alt } from './alt/Vector3'
// import { Vector3 as Vector3OG } from './og/Vector3'

// describe('Vector math benchmark', () => {
//     bench('OG Vector3', () => {
//         const v1 = new Vector3OG(1, 2, 3)
//         const v2 = new Vector3OG(4, 5, 6)
//         const v3 = new Vector3OG()

//         v1.add(v2)
//         v2.sub(v1)
//         v3.subVectors(v1, v2)

//         v1.multiply(v2)
//         v2.divide(v1)
//         v3.multiplyScalar(2)

//         v1.length()
//         v2.lengthSq()
//         v3.normalize()

//         v1.dot(v2)
//         v2.cross(v3)
//         v3.applyMatrix4({ elements: [1, 0, 0, 0, 1, 0, 0, 0, 1] })

//         v1.distanceTo(v2)
//         v2.distanceToSquared(v3)
//         v3.lerp(v1, 0.5)

//         v1.set(1, 2, 3)
//         v2.set(4, 5, 6)
//         v3.set(7, 8, 9)

//         v1.copy(v2)
//         v2.copy(v3)
//         v3.copy(v1)

//         v1.equals(v2)
//         v2.equals(v3)
//         v3.equals(v1)

//         v1.fromArray([1, 2, 3])
//         v2.fromArray([4, 5, 6])
//         v3.fromArray([7, 8, 9])

//         v1.equals(v2)
//         v2.fromArray(v3.toArray())
//     })

//     bench('Alt Vector3', () => {
        

//     })
// })
