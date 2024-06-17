export type UniformValueType =
	// | { type: 'sampler2D'; value: Partial<TextureOptions> | null }
	| { type: 'int'; value: (...args: any[]) => number }
	| { type: 'float'; value: (...args: any[]) => number }
	| { type: 'array'; value: (...args: any[]) => Uint8Array | Float32Array | number[] }
	| { type: 'vec2'; value: (...args: any[]) => [number, number] }
	| { type: 'vec3'; value: (...args: any[]) => [number, number, number] }
	| { type: 'vec4'; value: (...args: any[]) => [number, number, number, number] }
	| { type: 'mat2'; value: (...args: any[]) => Float32Array | number[] }
	| { type: 'mat3'; value: (...args: any[]) => Float32Array | number[] }
	| { type: 'mat4'; value: (...args: any[]) => Float32Array | number[] }

export type UniformOptions = {
	name: string
	update: (...args: any[]) => void
} & UniformValueType

export class Uniform {
	name: string
	location: WebGLUniformLocation
	type: UniformValueType['type']

	value: UniformValueType['value']
	update: (...args: any[]) => Uniform

	constructor(
		public gl: WebGL2RenderingContext,
		public program: WebGLProgram,
		options: UniformOptions,
	) {
		this.name = options.name
		this.type = options.type
		this.value = options.value

		this.location = gl.getUniformLocation(program, options.name)!
		if (!this.location && this.location !== 0) {
			console.warn(
				`Unused uniform detected - %c${this.name}`,
				'color: #f88; font-weight: bold;',
				'\nEnsure it is used in the shader program, or remove it from the uniform list.',
			)
		}
		this.update = () => {
			if (!this.location) return this
			options.update(this.location, this.value())
			return this
		}
	}
}
