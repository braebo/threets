import { Vector3, type Vec3 } from './Vector3.js'
import * as MathUtils from './MathUtils.js'
import type { Matrix4 } from './Matrix4.js'

const _startP = new Vector3()
const _startEnd = new Vector3()

export class Line3 {
	constructor(
		public start = new Vector3(),
		public end = new Vector3(),
	) {}

	set(start: Vec3, end: Vec3) {
		this.start.copy(start)
		this.end.copy(end)

		return this
	}

	copy(line: { start: Vec3; end: Vec3 }) {
		this.start.copy(line.start)
		this.end.copy(line.end)

		return this
	}

	getCenter(target: Vector3): Vector3 {
		return target.addVectors(this.start, this.end).multiplyScalar(0.5)
	}

	delta(target: Vector3) {
		return target.subVectors(this.end, this.start)
	}

	distanceSq() {
		return this.start.distanceToSquared(this.end)
	}

	distance() {
		return this.start.distanceTo(this.end)
	}

	at(t: any, target: any) {
		return this.delta(target).multiplyScalar(t).add(this.start)
	}

	closestPointToPointParameter(point: Vec3, clampToLine: Line3) {
		_startP.subVectors(point, this.start)
		_startEnd.subVectors(this.end, this.start)

		const startEnd2 = _startEnd.dot(_startEnd)
		const startEnd_startP = _startEnd.dot(_startP)

		let t = startEnd_startP / startEnd2

		if (clampToLine) {
			t = MathUtils.clamp(t, 0, 1)
		}

		return t
	}

	closestPointToPoint(point: Vec3, clampToLine: Line3, target: Vector3) {
		const t = this.closestPointToPointParameter(point, clampToLine)

		return this.delta(target).multiplyScalar(t).add(this.start)
	}

	applyMatrix4(matrix: Matrix4) {
		this.start.applyMatrix4(matrix)
		this.end.applyMatrix4(matrix)

		return this
	}

	equals(line: Line3) {
		return line.start.equals(this.start) && line.end.equals(this.end)
	}

	clone() {
		return new Line3().copy(this)
	}
}
