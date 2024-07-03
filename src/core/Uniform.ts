import type { Vector2, Vec2 } from './Vector2'
import type { Mat4 } from './Matrix4'
import type { Vec3 } from './Vector3'
import type { Stage } from './Stage'

import { Vector3 } from './Vector3'

type GL = WebGL2RenderingContext
type Loc = WebGLUniformLocation

/**
 * A map of uniform types to their respective webgl update methods.
 * @internal
 *
 */ // prettier-ignore
const UNIFORM_SETTERS = {
	float:		(gl: GL, loc: Loc, v: number)			=>	gl.uniform1f(loc, v),
	vec2:		(gl: GL, loc: Loc, v: Vector2 | Vec2)	=>	gl.uniform2f(loc, v.x, v.y),
	vec3:		(gl: GL, loc: Loc, v: Vector3 | Vec3)	=>	gl.uniform3f(loc, v.x, v.y, v.z),
	mat4:		(gl: GL, loc: Loc, v: Mat4)				=>	gl.uniformMatrix4fv(loc, false, v),
	floatArray:	(gl: GL, loc: Loc, v: Float32Array)		=>	gl.uniform1fv(loc, v),
	intArray:	(gl: GL, loc: Loc, v: Int32Array)		=>	gl.uniform1iv(loc, v),
	sampler2D:	(gl: GL, loc: Loc, v: number)			=>	gl.uniform1i(loc, v),
} as const

export type UniformValueType = keyof typeof UNIFORM_SETTERS
export type UniformValue<T extends UniformValueType = UniformValueType> = Parameters<
	(typeof UNIFORM_SETTERS)[T]
>[2]

/**
 * Options for the {@link Uniform} class.
 */
export type UniformOptions<T extends UniformValueType = UniformValueType> = {
	/**
	 * The name of the uniform in the shader program.
	 */
	name: string
	/**
	 * The type of the uniform. This should match the key of the {@link UNIFORM_SETTERS} object,
	 * and will determine the type of the value that can be set.
	 */
	type: T
	/**
	 * Initial value for the uniform. Can be a static value, updated with {@link Uniform.value},
	 * or a function that returns the value.
	 *
	 * If a function is provided, it will be called once to set the initial value, and then again
	 * on each update.
	 */
	value: UniformValue<T> | (() => UniformValue<T>)

	/**
	 * If `true`, the uniform will be updated automatically on each frame.
	 * @default true
	 */
	autoUpdate?: boolean
}

export class Uniform<const T extends UniformValueType = UniformValueType> {
	name: string
	type: T
	location: WebGLUniformLocation

	autoUpdate = true
	dirty = true

	private _value: UniformValue<T>

	/**
	 * If a function was provided for {@link UniformOptions.value}, it's stored here. Calling this
	 * will update {@link value} to the result of said function, and return it.  Otherwise, it will
	 * simply return {@link value} like a plain getter would.
	 *
	 * Conceptually, its a way to pass your own getter function to the uniform so it can retrieve
	 * its own dynamic value internally, stored in a way that doesn't require an internal check on
	 * each update.
	 */
	getValue: () => UniformValue<T>

	/**
	 * Updates the uniform in the shader program with the current {@link value}.
	 *
	 * @param newValue - Optionally provide a new value to update the uniform with.  If
	 * {@link UniformOptions.value} was a function, it will automatically be called to get the new
	 * value, but this will take precedence if provided.  If value is _not_ dynamic, this can
	 * be used as an alternative to updating {@link value} before each update.
	 */
	update: (newValue?: UniformValue<T>) => void

	constructor(
		public stage: Stage,
		options: UniformOptions<T>,
	) {
		this.name = options.name
		this.type = options.type
		this.location = stage.gl!.getUniformLocation(stage.program!, options.name)!
		if (options.autoUpdate === false) this.autoUpdate = false

		if (!this.location && this.location !== 0) {
			console.warn(
				`Unused uniform detected - %c${this.name}`,
				'color: #f88; font-weight: bold;',
				'\nEnsure it is used in the shader program, or remove it from the uniform list.',
			)
		}

		if (typeof options.value === 'function') {
			this.getValue = () => {
				this.value = (options.value as () => UniformValue<T>)()
				return this.value
			}
			this._value = this.getValue()
		} else {
			this._value = options.value
			this.getValue = () => this.value
		}

		this.update = (newValue) => {
			if (!this.location) return
			const v = newValue ?? this.getValue()
			// Only update if the value has changed (dirty will be set to true in the setter).
			if (v !== this._value) this.value = v
			// Don't update if the value hasn't changed.
			if (!this.dirty) return
			// @ts-expect-error - Typescript isn't smart enough to understand TValue is always mapped correctly.
			UNIFORM_SETTERS[this.type](this.stage.gl!, this.location, v)
			this.dirty = false
		}
	}

	/**
	 * The current value of the uniform. This can be updated directly, but will update itself
	 * automatically if a function was provided for {@link UniformOptions.value}.
	 */
	get value() {
		return this._value
	}
	set value(newValue: UniformValue<T>) {
		if (this._value != newValue) {
			this._value = newValue
			this.dirty = true
		}
	}
}
