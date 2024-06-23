import { Vector3 } from './Vector3'

export class Quaternion {
	constructor(
		public x: number = 0,
		public y: number = 0,
		public z: number = 0,
		public w: number = 1,
	) {}

	setFromAxisAngle(axis: Vector3, angle: number): this {
		const halfAngle = angle * 0.5
		const s = Math.sin(halfAngle)
		this.x = axis.x * s
		this.y = axis.y * s
		this.z = axis.z * s
		this.w = Math.cos(halfAngle)
		return this
	}

	fromEuler(x: number, y: number, z: number): this {
		const c1 = Math.cos(x / 2)
		const c2 = Math.cos(y / 2)
		const c3 = Math.cos(z / 2)
		const s1 = Math.sin(x / 2)
		const s2 = Math.sin(y / 2)
		const s3 = Math.sin(z / 2)

		this.x = s1 * c2 * c3 + c1 * s2 * s3
		this.y = c1 * s2 * c3 - s1 * c2 * s3
		this.z = c1 * c2 * s3 + s1 * s2 * c3
		this.w = c1 * c2 * c3 - s1 * s2 * s3

		return this
	}

	multiply(q: Quaternion): this {
		this.x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y
		this.y = this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x
		this.z = this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
		this.w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
		return this
	}

	rotateVector(v: Vector3): Vector3 {
		// Calculate quat * vector
		const ix = this.w * v.x + this.y * v.z - this.z * v.y
		const iy = this.w * v.y + this.z * v.x - this.x * v.z
		const iz = this.w * v.z + this.x * v.y - this.y * v.x
		const iw = -this.x * v.x - this.y * v.y - this.z * v.z

		// Calculate result * inverse quat
		return v.setXYZ(
			ix * this.w + iw * -this.x + iy * -this.z - iz * -this.y,
			iy * this.w + iw * -this.y + iz * -this.x - ix * -this.z,
			iz * this.w + iw * -this.z + ix * -this.y - iy * -this.x,
		)
	}

	toEulerAngles(): Vector3 {
		const euler = new Vector3()

		// Roll (x-axis rotation)
		const sinr_cosp = 2 * (this.w * this.x + this.y * this.z)
		const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y)
		euler.x = Math.atan2(sinr_cosp, cosr_cosp)

		// Pitch (y-axis rotation)
		const sinp = 2 * (this.w * this.y - this.z * this.x)
		if (Math.abs(sinp) >= 1) {
			euler.y = (Math.sign(sinp) * Math.PI) / 2 // use 90 degrees if out of range
		} else {
			euler.y = Math.asin(sinp)
		}

		// Yaw (z-axis rotation)
		const siny_cosp = 2 * (this.w * this.z + this.x * this.y)
		const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z)
		euler.z = Math.atan2(siny_cosp, cosy_cosp)

		return euler
	}
}
