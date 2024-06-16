export type UniformValueType =
	// | { type: 'sampler2D'; value: Partial<TextureOptions> | null }
	| { type: 'int'; value: (...args: any[]) => number }
	| { type: 'float'; value: (...args: any[]) => number }
	| { type: 'array'; value: (...args: any[]) => Uint8Array | Float32Array | number[] }
	| { type: 'vec2'; value: (...args: any[]) => [number, number] }
	| { type: 'vec3'; value: (...args: any[]) => [number, number, number] }
	| { type: 'vec4'; value: (...args: any[]) => [number, number, number, number] }

export type UniformOptions = {
	name: string
	update: (...args: any[]) => void
} & UniformValueType

export class Uniform {
	name: string
	location: WebGLUniformLocation
	value: UniformValueType['value']
	type: UniformValueType['type']

	update: (...args: any[]) => Uniform

	constructor(public gl: WebGL2RenderingContext, public program: WebGLProgram, options: UniformOptions) {
		this.name = options.name
		this.type = options.type
		this.value = options.value
		this.location = gl.getUniformLocation(program, options.name)!
		if (!this.location) {
			console.error('Failed to get uniform location', { name: options.name, location: this.location })
			throw new Error('Failed to get uniform location')
		}
		this.update = () => {
			options.update(this.location, this.value())
			return this
		}
	}
}
