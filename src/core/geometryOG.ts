import type { GLMode, GLPrimitive } from './types'

import { Log } from './utils'

export interface BufferGeometryOptions {
	name: string
	/**
	 * The vertex positions data.
	 */
	positions: Float32Array
	indices?: Uint16Array
	/**
	 * The rendering method to use when drawing the geometry.
	 * @default gl.TRIANGLES
	 */
	mode?: GLMode
	// attrs
	size?: number
	/**
	 * @default gl.FLOAT
	 */
	type?: GLPrimitive
	normalize?: boolean
	stride?: number
	offset?: number
}

export function isBufferGeometry(object: any): object is BufferGeometry {
	return typeof object === 'object' && object.__type === 'BufferGeometry'
}

@Log('BufferGeometry')
export class BufferGeometry {
	__type = 'BufferGeometry'
	name: string

	location: number
	buffer: WebGLBuffer

	_positions: Float32Array
	indices?: Uint16Array
	mode: GLMode
	size: number
	type: GLPrimitive

	normalize: boolean
	stride: number
	offset: number

	set positions(positions: Float32Array) {
		this._positions = positions
		// this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)
	}

	get vertexCount() {
		return this._positions?.length / this.size
	}

	constructor(
		public gl: WebGL2RenderingContext,
		program: WebGLProgram,
		options: BufferGeometryOptions,
	) {
		this._positions = options.positions || new Float32Array()
		this.indices = options.indices

		this.name = options.name
		this.size = options.size ?? 3
		this.type = options.type ?? gl.FLOAT
		this.normalize = options.normalize ?? false
		this.stride = options.stride ?? 0
		this.offset = options.offset ?? 0
		this.mode = options.mode ?? gl.TRIANGLES

		this.location = gl.getAttribLocation(program, options.name)

		this.buffer = gl.createBuffer()!
		if (!this.buffer) {
			throw new Error('❌ Failed to create buffer', {
				cause: { options, buffer: this.buffer },
			})
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
		gl.vertexAttribPointer(
			this.location,
			this.size,
			this.type,
			this.normalize,
			this.stride,
			this.offset,
		)

		gl.bufferData(gl.ARRAY_BUFFER, this._positions, gl.STATIC_DRAW)

		if (this.indices) {
			const indexBuffer = gl.createBuffer()!
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW)
		}
	}

	render() {
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this._positions, this.gl.STATIC_DRAW)
		this.gl.enableVertexAttribArray(this.location)
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
		this.gl.vertexAttribPointer(
			this.location,
			this.size,
			this.type,
			this.normalize,
			this.stride,
			this.offset,
		)

		if (this.indices) {
			this.gl.drawElements(this.mode, this.indices.length, this.gl.UNSIGNED_SHORT, 0)
		} else {
			this.gl.drawArrays(this.mode, 0, this.vertexCount)
		}
	}
}
