import type { UniformOptions, UniformValueType } from './Uniform'
import type { GeometryOptions } from './Geometry'
import type { CameraOptions } from './Camera'
import type { QuerySelector } from './types'
import type { Vec3 } from './Vector3'

import { Vector3, isVector3 } from './Vector3'
import { LinkedListener } from './Listener'
import { Transform } from './Transform'
import { Geometry } from './Geometry'
import { Uniform } from './Uniform'
import { Vector2 } from './Vector2'
import { Camera } from './Camera'
import { select } from './utils'

export interface StageOptions {
	canvas?: HTMLCanvasElement | QuerySelector
	container?: HTMLElement | QuerySelector
	autoInit?: boolean
	vertex?: string
	fragment?: string
	depth?: number
	camera?: CameraOptions
	geometries?: GeometryOptions[]
	uniforms?: UniformOptions[]
}

// @Log('Stage', ['render', 'update', '_emitOnUpdate'])
export class Stage {
	opts: StageOptions

	canvas!: HTMLCanvasElement
	dimensions = new Vector2()
	container!: HTMLElement
	resizeObserver!: ResizeObserver

	gl: WebGL2RenderingContext | null = null
	program: WebGLProgram | null = null

	uniforms: Map<
		'u_resolution' | 'u_modelMatrix' | 'u_viewMatrix' | 'u_projectionMatrix' | string,
		Uniform
	> = new Map()
	geometries: Map<'a_position' | string, Geometry> = new Map()

	camera!: Camera
	transform!: Transform

	worldOrigin = new Transform().matrix

	uModelMatrix!: Uniform

	vertexShader: WebGLShader | null = null
	vertex: string | null = `#version 300 es
precision mediump float;

in vec4 a_position;
uniform vec2 u_resolution;
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
out vec2 v_uv;

void main() {
    v_uv = a_position.xy * 0.5 + 0.5;
    vec4 worldPosition = u_modelMatrix * a_position;
    vec4 viewPosition = u_viewMatrix * worldPosition;
    gl_Position = u_projectionMatrix * viewPosition;
}`

	fragmentShader: WebGLShader | null = null
	fragment: string | null = `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

void main() {
   fragColor = vec4(v_uv.x, v_uv.y, v_uv.y + v_uv.x, 1.0);
}`

	initialized = false

	constructor(options?: StageOptions) {
		this.opts = options ?? {}

		if (this.opts?.autoInit) {
			if (typeof globalThis.window === 'undefined') {
				// @ts-ignore
				if (!!import.meta?.env?.DEV) {
					console.warn(
						'PocketShader is not running in a browser environment.  Aborting automatic initialization.',
					)
				}
				return
			}

			if (globalThis.document?.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', this.init)
			} else {
				this.init().then(() => {
					this.maybeRender()
				})
			}
		}

		if (options?.autoInit ?? true) {
			if (typeof globalThis.document === 'undefined') return

			this.init().then(() => {
				this.maybeRender()
			})
		}
	}

	async init() {
		if (this.initialized) return
		this.initialized = true

		//* Setup Container

		this.container = this.opts.container ? select(this.opts.container) : document.body

		//* Setup Canvas

		let canvas = select(this.opts.canvas)
		if (!canvas) {
			canvas = document.createElement('canvas')
			this.container.appendChild(canvas)
		}
		this.canvas = canvas as HTMLCanvasElement

		this.resizeObserver = new ResizeObserver(this.onResize.bind(this))
		this.resizeObserver.observe(this.canvas as HTMLCanvasElement, { box: 'content-box' })

		this.resize()

		//* Setup WebGL Context

		const gl = this.canvas.getContext('webgl2')
		if (!gl) throw new Error('WebGL2 not supported')
		this.gl = gl

		//* Setup Shaders

		if (this.opts?.vertex) this.vertex = this.opts.vertex
		if (this.opts?.fragment) this.fragment = this.opts.fragment

		this.vertexShader = this._compileShader(this.gl.VERTEX_SHADER, this.vertex!)
		this.fragmentShader = this._compileShader(this.gl.FRAGMENT_SHADER, this.fragment!)

		this.program = this._createProgram()

		//* Setup Camera

		this.camera = new Camera(this, {
			fov: this.opts.camera?.fov ?? 60,
			aspect: this.opts.camera?.aspect ?? this.canvas.width / this.canvas.height,
			near: this.opts.camera?.near ?? 1,
			far: this.opts.camera?.far ?? 2000,
			position: this.opts.camera?.position,
			rotation: this.opts.camera?.rotation,
		})

		//* Setup Uniforms

		this._createDefaultUniforms()

		if (this.opts?.uniforms) {
			for (const uniform of this.opts.uniforms) {
				this.addUniform(uniform)
			}
		}

		//* Setup Geometries

		if (this.opts?.geometries) {
			for (const geometry of this.opts.geometries) {
				this.addGeometry(geometry)
			}
		}
	}

	addUniform<T extends UniformValueType>(options: UniformOptions<T>): Uniform<T> {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')

		const uniform = new Uniform(this, options)
		this.uniforms.set(options.name, uniform)

		return uniform as Uniform<T>
	}

	addGeometry(options: GeometryOptions): Geometry {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')

		const geometry = new Geometry(this, options)
		this.geometries.set(options.name, geometry)
		return geometry
	}

	update() {
		for (const uniform of this.uniforms.values()) {
			uniform.update()
		}
		this._emitOnUpdate()
	}

	onUpdate(callback: () => void) {
		this._onUpdateListeners ??= new LinkedListener(callback, { ctx: this })
		this._onUpdateListeners.add(callback, { ctx: this })
	}
	private _onUpdateListeners?: LinkedListener | null
	private _emitOnUpdate() {
		let listener = this._onUpdateListeners as LinkedListener | null
		while (listener) {
			listener = listener.emit()
		}
	}

	render() {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')

		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
		this.gl.clearColor(0, 0, 0, 0)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
		this.gl.enable(this.gl.DEPTH_TEST)
		this.gl.useProgram(this.program)

		this.update()

		for (const geometry of this.geometries.values()) {
			geometry.render()
		}
	}

	/** @todo - Render loop state check? */
	maybeRender() {
		if (this.initialized) this.render()
	}

	resize() {
		const dpr = window.devicePixelRatio
		const displayWidth = Math.floor(this.canvas.clientWidth * dpr)
		const displayHeight = Math.floor(this.canvas.clientHeight * dpr)
		this.canvas.width = displayWidth
		this.canvas.height = displayHeight
	}

	onResize(entries: ResizeObserverEntry[]) {
		const target = entries[0].target
		if (target instanceof HTMLCanvasElement) {
			this.canvas.width = entries[0].devicePixelContentBoxSize[0].inlineSize
			this.canvas.height = entries[0].devicePixelContentBoxSize[0].blockSize
			this.maybeRender()
		}
	}

	private _createDefaultUniforms() {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')

		this.addUniform({
			name: 'u_resolution',
			type: 'vec2',
			value: () => ({ x: this.canvas.width, y: this.canvas.height }),
		})

		this.addUniform({
			name: 'u_time',
			type: 'float',
			value: () => performance.now() / 1000,
		})

		this.uModelMatrix = this.addUniform({
			name: 'u_modelMatrix',
			type: 'mat4',
			value: () => this.worldOrigin, // defaults to identity matrix
		})

		this.addUniform({
			name: 'u_viewMatrix',
			type: 'mat4',
			value: () => this.camera.viewMatrix,
		})

		this.addUniform({
			name: 'u_projectionMatrix',
			type: 'mat4',
			value: () => this.camera.projectionMatrix,
		})
	}

	private _createProgram() {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.vertex) throw new Error('Vertex shader not found')
		if (!this.fragment) throw new Error('Fragment shader not found')

		const program = this.gl.createProgram()!
		if (!program) throw new Error('Failed to create program.')

		this.gl.attachShader(program, this.vertexShader!)
		this.gl.attachShader(program, this.fragmentShader!)
		this.gl.linkProgram(program)

		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			throw new Error('❌ Failed to link program', {
				cause: this.gl.getProgramInfoLog(program),
			})
		}

		if (this.vertexShader) {
			this.gl.detachShader(program, this.vertexShader)
			this.gl.deleteShader(this.vertexShader)
		}
		if (this.fragmentShader) {
			this.gl.detachShader(program, this.fragmentShader)
			this.gl.deleteShader(this.fragmentShader)
		}

		return program
	}

	private _compileShader(
		type: WebGL2RenderingContext['VERTEX_SHADER'] | WebGL2RenderingContext['FRAGMENT_SHADER'],
		source: string,
	) {
		if (!this.gl) throw new Error('WebGL2 context not found')

		const shader = this.gl.createShader(type)
		if (!shader) throw new Error('❌ Failed to create shader', { cause: { source, type } })
		this.gl.shaderSource(shader, source)
		this.gl.compileShader(shader)

		const message = this.gl.getShaderInfoLog(shader)
		const status = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)
		if (!status || message?.length) {
			console.error(
				`❌ Failed to compile ${
					type == this.gl.VERTEX_SHADER ? 'vertex' : 'fragment'
				} shader`,
			)
			throw new Error(message ?? 'Unknown error...', { cause: { source, type } })
		}

		return shader
	}

	/**
	 * Adds a canvas-sized quad geometry attatched to the `a_position` attribute.
	 *
	 * The geometry is accessible via the `geometries` property:
	 * ```ts
	 * const quad = stage.geometries.get('a_position')
	 * ```
	 */
	addSimpleQuad(): this {
		// prettier-ignore
		this.addGeometry({
            name: 'a_position',
            positions: new Float32Array([
                -1, -1, 0,  // bottom left corner
                 1, -1, 0,  // bottom right corner
                -1,  1, 0,  // top left corner
                 1,  1, 0,  // top right corner
            ]),
            indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
        })

		return this
	}
}

// export type GeometryOptions = {
// 	transform?: TransformOptions
// 	buffer?: GeometryOptions
// }

// class Geometry {
// 	transform: Transform
// 	buffer: Geometry

// 	constructor(
// 		public stage: Stage,
// 		options?: GeometryOptions,
// 	) {
// 		this.stage = stage
// 		this.transform = new Transform()
// 		this.buffer = new Geometry(
// 			this.stage,
// 			options?.buffer ?? { name: 'a_position', positions: new Float32Array() },
// 		)
// 	}
// }

export interface PlaneOptions extends GeometryOptions {
	scale: number
	width: number
	height: number
	subdivisions: number
}

export class Plane extends Geometry {
	get scale(): Vector3 {
		return this.transform?.scale
	}
	set scale(value: number | Vector3 | Vec3) {
		this.transform?.scaleBy(...(isVector3(value) ? value : new Vector3(value)).toArray())
	}

	constructor(stage: Stage, options?: Partial<PlaneOptions>) {
		const opts = {
			width: options?.width ?? 1,
			height: options?.height ?? 1,
			subdivisions: options?.subdivisions ?? 1,
			transform: options?.transform,
		}
		const { width, height, subdivisions } = opts

		const positions = []
		const indices = []

		const halfWidth = width / 2
		const stepX = width / subdivisions

		const halfHeight = height / 2
		const stepY = height / subdivisions

		let index = 0
		for (let y = -halfHeight; y < halfHeight; y += stepY) {
			for (let x = -halfWidth; x < halfWidth; x += stepX) {
				positions.push(x, y, 0)
				positions.push(x + stepX, y, 0)
				positions.push(x, y + stepY, 0)
				positions.push(x + stepX, y + stepY, 0)

				indices.push(index, index + 1, index + 2)
				indices.push(index + 1, index + 3, index + 2)

				index += 4
			}
		}

		super(stage, {
			...options,
			name: options?.name ?? 'a_position',
			positions: options?.positions ?? new Float32Array(),
			indices: options?.indices,
		})
	}
}
