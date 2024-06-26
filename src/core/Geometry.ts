import type { TransformOptions } from './Transform'
import type { GLMode, GLPrimitive } from './types'
import type { Stage } from './Stage'

import { Transform } from './Transform'

export interface GeometryOptions {
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
	/**
	 * The number of components per vertex attribute.
	 */
	size?: number
	/**
	 * @default gl.FLOAT
	 */
	type?: GLPrimitive
	normalize?: boolean
	stride?: number
	offset?: number
	transform?: TransformOptions
	/**
	 * If true, {@link WebGLVertexArrayObject|Vertex Array Objects} will be leveraged for performance.
	 *
	 * note: Only enable VAO's for static geometry that doesn't change often.
	 * @default false
	 */
	static?: boolean
}

export function isGeometry(object: any): object is Geometry {
	return typeof object === 'object' && object.__type === 'Geometry'
}

export class Geometry {
	__type = 'Geometry'
	name: string

	transform: Transform

	location: number
	buffer: WebGLBuffer
	vao: WebGLVertexArrayObject | null = null
	private readonly _static: boolean
	get isStatic() {
		return this._static
	}

	_positions: Float32Array
	indices?: Uint16Array
	mode: GLMode
	/**
	 * The number of components per vertex attribute.
	 */
	size: number
	type: GLPrimitive

	normalize: boolean
	stride: number
	offset: number

	get gl() {
		return this.stage.gl!
	}
	get program() {
		return this.stage.program!
	}

	get positions() {
		return this._positions
	}
	set positions(positions: Float32Array) {
		if (this.isStatic) {
			throw new Error(
				'❌ set Geometry.positions - Attempted to update static Geometry positions.',
			)
		}
		this._positions = positions
		// Update the buffer data
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)
	}

	get vertexCount() {
		return this._positions?.length / this.size
	}

	constructor(
		public stage: Stage,
		options: GeometryOptions,
	) {
		this._positions = options.positions || new Float32Array()
		this.indices = options.indices

		this.transform = new Transform(options.transform)

		this.name = options.name
		this.size = options.size ?? 3
		this.type = options.type ?? this.gl.FLOAT
		this.normalize = options.normalize ?? false
		this.stride = options.stride ?? 0
		this.offset = options.offset ?? 0
		this.mode = options.mode ?? this.gl.TRIANGLES
		this._static = Object.freeze(!!options.static)

		this.location = this.gl.getAttribLocation(this.program, options.name)

		this.buffer = this.gl.createBuffer()!
		if (!this.buffer) {
			throw new Error('❌ Failed to create buffer', {
				cause: { options, buffer: this.buffer },
			})
		}

		if (this.isStatic) {
			this.setupVAO()
		} else {
			this.setup()
		}

		this.gl.bindVertexArray(null)
	}

	beforeRender = (): void => {
		throw new Error('❌ Geometry.beforeRender() missing implementation.')
	}

	updateModelMatrix() {
		this.stage.uModelMatrix.update()
	}

	setGeometry(positions: Float32Array, indices?: Uint16Array) {
		if (this.isStatic) {
			throw new Error('❌ Attempted to update static Geometry.')
		}
		this.positions = positions
		if (indices) {
			this.indices = indices
		}
	}

	refreshPositions() {
		this.positions = this._positions
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this._positions, this.gl.STATIC_DRAW)
	}

	setup() {
		this.beforeRender = () => {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
			this.gl.bufferData(this.gl.ARRAY_BUFFER, this._positions, this.gl.STATIC_DRAW)
			this.gl.vertexAttribPointer(
				this.location,
				this.size,
				this.type,
				this.normalize,
				this.stride,
				this.offset,
			)
			this.gl.enableVertexAttribArray(this.location)

			if (this.indices) {
				const indexBuffer = this.gl.createBuffer()!
				this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
				this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW)
			}
		}

		this.beforeRender()
	}

	setupVAO() {
		this.beforeRender = () => {
			this.gl.bindVertexArray(this.vao)
		}
		this.beforeRender()

		this.vao = this.gl.createVertexArray()
		this.gl.bindVertexArray(this.vao)

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
		this.gl.vertexAttribPointer(
			this.location,
			this.size,
			this.type,
			this.normalize,
			this.stride,
			this.offset,
		)
		this.gl.enableVertexAttribArray(this.location)

		if (this.indices) {
			const indexBuffer = this.gl.createBuffer()!
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
			this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW)
		}

		this.gl.bindVertexArray(null)
	}

	render() {
		this.beforeRender()
		this.updateModelMatrix()

		if (this.indices) {
			this.gl.drawElements(this.mode, this.indices.length, this.gl.UNSIGNED_SHORT, 0)
		} else {
			this.gl.drawArrays(this.mode, 0, this.vertexCount)
		}

		this.gl.bindVertexArray(null)
	}
}
