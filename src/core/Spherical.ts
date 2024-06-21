import { Vector3 } from './Vector3'

export function isSpherical(thing: any): thing is Spherical {
	return thing && (thing instanceof Spherical || thing.__type === 'Spherical')
}

/**
 * A set of spherical coordinates representing a point in 3D space.
 */
export class Spherical {
	readonly __type = 'Spherical' as const

	/**
	 * A small number used to prevent floating point errors.
	 */
	private static readonly EPSILON = 0.000001 as const

	/**
	 * A cached vector used for calculations.
	 */
	private _vec3 = new Vector3()

	constructor(public radius = 1, private _phi = 0, public theta = 0) {}

	get phi(): number {
		return this._phi
	}
	set phi(value: number) {
		this._phi = Math.max(Spherical.EPSILON, Math.min(Math.PI - Spherical.EPSILON, value))
	}

	/**
	 * Sets the values of this Spherical from the given radius, polar angle, and azimuthal angle.
	 */
	set(radiusOrSpherical: number | Spherical, phi?: number, theta?: number): this {
		if (isSpherical(radiusOrSpherical)) {
			this.radius = radiusOrSpherical.radius
			this.phi = radiusOrSpherical.phi
			this.theta = radiusOrSpherical.theta
			return this
		} else {
			this.radius = radiusOrSpherical
			this.phi = phi ?? this.phi
			this.theta = theta ?? this.theta
		}
		return this
	}

	clone(): Spherical {
		return new Spherical(this.radius, this.phi, this.theta)
	}

	/**
	 * Derives the spherical coordinates from a camera/object position, and a target vector to
	 * look at / orbit around by passing their relative difference vector to the
	 * {@link setFromVector3|`setFromVector3`} method.
	 */
	setFromVectors(position: Vector3, target: Vector3): this {
		return this.setFromVector3(this._vec3.set(position).subtract(target))
	}

	/**
	 * Sets the values of this Spherical from the given Cartesian coordinates (x, y, z).
	 * @remarks
	 * The conversion from Cartesian to spherical coordinates is as follows:
	 * - radius: The radial distance from the origin to the point, calculated as sqrt(x^2 + y^2 + z^2).
	 * - phi: The polar angle (inclination) in radians, measured from the positive y-axis to the vector from the origin to the point. It ranges from 0 to PI.
	 * - theta: The azimuthal angle in radians, measured from the positive z-axis to the projection of the vector onto the x-z plane. It ranges from 0 to 2*PI.
	 */
	setFromVector3(vec: Vector3): this {
		this.radius = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z)

		if (this.radius === 0) {
			this.theta = 0
			this.phi = 0
		} else {
			this.theta = Math.atan2(vec.x, vec.z)
			this.phi = Math.acos(Math.min(Math.max(vec.y / this.radius, -1), 1))
		}

		return this
	}
}
