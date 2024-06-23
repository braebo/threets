import { bench, describe } from 'vitest'

import { Matrix4 as Matrix4Alt } from '../alt/Matrix4.js'
import { Matrix4 as Matrix4OG } from '../og/Matrix4.js'

import { Vector3 as Vector3Alt } from '../alt/Vector3.js'
import { Vector3 as Vector3OG } from '../og/Vector3.js'

import { Quaternion as QuaternionAlt } from '../alt/Quaternion.js'
import { Quaternion as QuaternionOG } from '../og/Quaternion.js'

import { Euler as EulerAlt } from '../alt/Euler.js'
import { Euler as EulerOG } from '../og/Euler.js'

const opts = {
	warmupIterations: 10,
	warmupTime: 1000,
	iterations: 1000,
}

const benchAlt = () => {
	const m1 = new Matrix4Alt()
	const m2 = new Matrix4Alt()
	const m3 = new Matrix4Alt()

	// m1.identity()
	m1.set(Matrix4Alt.IDENTITY)
	m2.makeRotationX(1)
	m3.makeRotationY(2)

	m1.premultiply(m2)
	m2.premultiply(m3)
	m3.premultiply(m1)

	m1.determinant()
	m2.determinant()
	m3.determinant()

	m1.invert()
	m2.invert()
	m3.invert()

	m1.transpose()
	m2.transpose()
	m3.transpose()

	m1.copy(m2)
	m2.copy(m3)
	m3.copy(m1)

	m1.extractBasis(new Vector3Alt(1, 2, 3), new Vector3Alt(4, 5, 6), new Vector3Alt(7, 8, 9))
	m2.makeBasis(new Vector3Alt(1, 2, 3), new Vector3Alt(4, 5, 6), new Vector3Alt(7, 8, 9))
	m3.extractRotation(new Matrix4Alt())

	m1.makeTranslation(1, 2, 3)
	m2.makeRotationX(1)
	m3.makeRotationY(2)

	m1.makeRotationFromEuler(new EulerAlt(1, 2, 3))
	m2.makeRotationFromQuaternion(new QuaternionAlt(1, 2, 3, 4))

	m1.scale(new Vector3Alt(1, 2, 3))
	m2.getMaxScaleOnAxis()
}

const benchOG = () => {
	const m1 = new Matrix4OG()
	const m2 = new Matrix4OG()
	const m3 = new Matrix4OG()

	m1.identity()
	m2.makeRotationX(1)
	m3.makeRotationY(2)

	m1.premultiply(m2)
	m2.premultiply(m3)
	m3.premultiply(m1)

	m1.determinant()
	m2.determinant()
	m3.determinant()

	m1.invert()
	m2.invert()
	m3.invert()

	m1.transpose()
	m2.transpose()
	m3.transpose()

	m1.copy(m2)
	m2.copy(m3)
	m3.copy(m1)

	m1.extractBasis(new Vector3OG(1, 2, 3), new Vector3OG(4, 5, 6), new Vector3OG(7, 8, 9))
	m2.makeBasis(new Vector3OG(1, 2, 3), new Vector3OG(4, 5, 6), new Vector3OG(7, 8, 9))
	m3.extractRotation(new Matrix4OG())

	m1.makeTranslation(1, 2, 3)
	m2.makeRotationX(1)
	m3.makeRotationY(2)

	m1.makeRotationFromEuler(new EulerOG(1, 2, 3))
	m2.makeRotationFromQuaternion(new QuaternionOG(1, 2, 3, 4))

	m1.scale(new Vector3OG(1, 2, 3))
	m2.getMaxScaleOnAxis()
}

describe('Matrix4 math benchmark', () => {
	bench('1 Alt Matrix4', benchAlt, opts)
	bench('1 OG Matrix4', benchOG, opts)
	bench('2 Alt Matrix4', benchAlt, opts)
	bench('2 OG Matrix4', benchOG, opts)
})
