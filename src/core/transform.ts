import type { Vec3 } from './Vector3'
import type { Mat4 } from './Matrix'

import { subtractVectors, cross, normalize, Log } from './utils'
import { Vector3 } from './Vector3'

export interface TransformOptions {
	identity: () => Mat4
	position?: Vector3
	rotation?: Vector3
	scale?: Vector3
}

/**
 * A 3D transformation matrix.
 */
@Log('Transform')
export class Transform {
	position: Vector3
	rotation: Vector3
	scale: Vector3
	matrix!: Mat4

	constructor(options?: TransformOptions) {
		this.position = options?.position ?? new Vector3(0)
		this.rotation = options?.rotation ?? new Vector3(0)
		this.scale = options?.scale ?? new Vector3(1)

		// prettier-ignore
		this.identity = options?.identity ?? (() => {
            return [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]
        })

		this.update()
	}

	identity: () => Mat4

	update() {
		console.log(new Error().stack)
		this.matrix = this.identity()
		this.translate(this.position.x, this.position.y, this.position.z)
			.rotateX(this.rotation.x)
			.rotateY(this.rotation.y)
			.rotateZ(this.rotation.z)
			.scaleBy(this.scale.x, this.scale.y, this.scale.z)
	}

	static perspective(
		fieldOfViewInRadians: number,
		aspect: number,
		near: number,
		far: number,
	): Mat4 {
		const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians)
		const rangeInv = 1.0 / (near - far)

		// prettier-ignore
		return [
			f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (near + far) * rangeInv, -1,
			0, 0, near * far * rangeInv * 2, 0
		];
	}

	/**
	 * A y-up right-handed orthographic projection matrix.
	 */
	static projection(width: number, height: number, depth: number): Mat4 {
		// prettier-ignore
		// //- Note: This matrix flips the Y axis so 0 is at the top.
		return [
			2 / width, 0, 0, 0,
			0, -2 / height, 0, 0,
			0, 0, 2 / depth, 0,
			-1, 1, 0, 1,
		];
	}

	lookAt(
		target: Vec3 | Vector3,
		up: Vec3 | Vector3,
	): this {
		const zAxis = normalize(subtractVectors(this.position, target))
		const xAxis = normalize(cross(up, zAxis))
		const yAxis = normalize(cross(zAxis, xAxis))
		// prettier-ignore
		this.matrix = [
			xAxis.x, xAxis.y, xAxis.z, 0,
			yAxis.x, yAxis.y, yAxis.z, 0,
			zAxis.x, zAxis.y, zAxis.z, 0,
			this.position.x,
			this.position.y,
			this.position.z,
			1,
		]
		return this
	}

	translation(tx: number, ty: number, tz: number): Mat4 {
		// prettier-ignore
		return [
			1,  0,  0,  0,
			0,  1,  0,  0,
			0,  0,  1,  0,
			tx, ty, tz, 1,
	  ];
	}

	rotationX(angleInRadians: number): Mat4 {
		const c = Math.cos(angleInRadians)
		const s = Math.sin(angleInRadians)
		// prettier-ignore
		return [
			1, 0, 0, 0,
			0, c, s, 0,
			0, -s, c, 0,
			0, 0, 0, 1,
	  ];
	}

	rotationY(angleInRadians: number): Mat4 {
		const c = Math.cos(angleInRadians)
		const s = Math.sin(angleInRadians)
		// prettier-ignore
		return [
			c, 0, -s, 0,
			0, 1, 0, 0,
			s, 0, c, 0,
			0, 0, 0, 1,
	  ];
	}

	rotationZ(angleInRadians: number): Mat4 {
		const c = Math.cos(angleInRadians)
		const s = Math.sin(angleInRadians)
		// prettier-ignore
		return [
		 	c, s, 0, 0,
			-s, c, 0, 0,
		 	0, 0, 1, 0,
		 	0, 0, 0, 1,
	  ];
	}

	scaling(sx: number, sy: number, sz: number): Mat4 {
		// prettier-ignore
		return [
			sx, 0, 0, 0,
			0, sy, 0, 0,
			0, 0, sz, 0,
			0, 0, 0, 1
		]
	}

	translate(tx: number, ty: number, tz: number): this {
		this.matrix = this.multiply(this.matrix, this.translation(tx, ty, tz))
		return this
	}

	rotateX(angleInRadians: number): this {
		this.matrix = this.multiply(this.matrix, this.rotationX(angleInRadians))
		return this
	}

	rotateY(angleInRadians: number): this {
		this.matrix = this.multiply(this.matrix, this.rotationY(angleInRadians))
		return this
	}

	rotateZ(angleInRadians: number): this {
		this.matrix = this.multiply(this.matrix, this.rotationZ(angleInRadians))
		return this
	}

	scaleBy(x: number, y: number, z: number): this {
		this.matrix = this.multiply(this.matrix, this.scaling(x, y, z))
		return this
	}

	multiply(a: Mat4, b: Mat4): Mat4 {
		const b00 = b[0 * 4 + 0]
		const b01 = b[0 * 4 + 1]
		const b02 = b[0 * 4 + 2]
		const b03 = b[0 * 4 + 3]
		const b10 = b[1 * 4 + 0]
		const b11 = b[1 * 4 + 1]
		const b12 = b[1 * 4 + 2]
		const b13 = b[1 * 4 + 3]
		const b20 = b[2 * 4 + 0]
		const b21 = b[2 * 4 + 1]
		const b22 = b[2 * 4 + 2]
		const b23 = b[2 * 4 + 3]
		const b30 = b[3 * 4 + 0]
		const b31 = b[3 * 4 + 1]
		const b32 = b[3 * 4 + 2]
		const b33 = b[3 * 4 + 3]
		const a00 = a[0 * 4 + 0]
		const a01 = a[0 * 4 + 1]
		const a02 = a[0 * 4 + 2]
		const a03 = a[0 * 4 + 3]
		const a10 = a[1 * 4 + 0]
		const a11 = a[1 * 4 + 1]
		const a12 = a[1 * 4 + 2]
		const a13 = a[1 * 4 + 3]
		const a20 = a[2 * 4 + 0]
		const a21 = a[2 * 4 + 1]
		const a22 = a[2 * 4 + 2]
		const a23 = a[2 * 4 + 3]
		const a30 = a[3 * 4 + 0]
		const a31 = a[3 * 4 + 1]
		const a32 = a[3 * 4 + 2]
		const a33 = a[3 * 4 + 3]

		return [
			b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
			b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
			b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
			b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
			b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
			b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
			b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
			b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
			b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
			b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
			b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
			b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
			b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
			b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
			b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
			b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
		]
	}
}
