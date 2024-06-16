export interface GeometryOptions {
	name: string
	// data
	positions?: Float32Array
	indices?: Uint16Array
	// attrs
	size?: number
	type?: number
	normalize?: boolean
	stride?: number
	offset?: number
}

export class Geometry {
	name: string

	location: number
	buffer: WebGLBuffer

	_positions: Float32Array
	indices?: Uint16Array

	size: number
	type: number
	normalize: boolean
	stride: number
	offset: number

	set positions(positions: Float32Array) {
		this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)
	}

	get vertexCount() {
		return this._positions.length / this.size
	}

	constructor(public gl: WebGL2RenderingContext, program: WebGLProgram, options: GeometryOptions) {
		this._positions = options.positions || new Float32Array()
		this.indices = options.indices

		this.name = options.name
		this.size = options.size ?? 3
		this.type = options.type ?? gl.FLOAT
		this.normalize = options.normalize ?? false
		this.stride = options.stride ?? 0
		this.offset = options.offset ?? 0

		this.location = gl.getAttribLocation(program, options.name)

		this.buffer = gl.createBuffer()!
		if (!this.buffer) {
			console.error('Failed to create buffer', { options, buffer: this.buffer })
			throw new Error('Failed to create buffer')
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
		gl.vertexAttribPointer(this.location, this.size, this.type, this.normalize, this.stride, this.offset)

		gl.bufferData(gl.ARRAY_BUFFER, this._positions, gl.STATIC_DRAW)

		if (this.indices) {
			const indexBuffer = gl.createBuffer()!
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW)
		}
	}

	render() {
		this.gl.enableVertexAttribArray(this.location)
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
		this.gl.vertexAttribPointer(this.location, this.size, this.type, this.normalize, this.stride, this.offset)

		if (this.indices) {
			this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0)
		} else {
			this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount)
		}
	}
}
