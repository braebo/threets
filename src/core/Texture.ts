import type { Uniform } from './Uniform'
import type { Stage } from './Stage'

type GL = WebGL2RenderingContext

// type TextureFormat = NonNullable<TextureOptions['format']>
type TextureFormat = 'RED' | 'RG' | 'RGB' | 'RGBA' | 'R32F' | 'RG32F' | 'RGB32F' | 'RGBA32F'
// prettier-ignore
type TextureType = NonNullable<TextureOptions['type']>
// prettier-ignore
type TextureFilter = NonNullable<TextureOptions['minFilter'] | TextureOptions['magFilter']>
type TextureWrap = NonNullable<TextureOptions['wrapS'] | TextureOptions['wrapT']>

// prettier-ignore
export interface TextureOptions {
    name: string
	data: Float32Array
    size?: number
    format?: 'RED' | 'RG' | 'RGB' | 'RGBA' | 'R32F' | 'RG32F' | 'RGB32F' | 'RGBA32F'
	internalFormat?: 'RED' | 'RG' | 'RGB' | 'RGBA' | 'R32F' | 'RG32F' | 'RGB32F' | 'RGBA32F'
    type?: 'FLOAT' | 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT_5_6_5' | 'UNSIGNED_SHORT_4_4_4_4' | 'UNSIGNED_SHORT_5_5_5_1'
    minFilter?: 'NEAREST' | 'LINEAR' | 'NEAREST_MIPMAP_NEAREST' | 'LINEAR_MIPMAP_NEAREST' | 'NEAREST_MIPMAP_LINEAR' | 'LINEAR_MIPMAP_LINEAR'
    magFilter?: 'NEAREST' | 'LINEAR'
    wrapS?: 'REPEAT' | 'CLAMP_TO_EDGE' | 'MIRRORED_REPEAT'
    wrapT?: 'REPEAT' | 'CLAMP_TO_EDGE' | 'MIRRORED_REPEAT'
}

export class Texture {
	private static availableUnits: Set<number>
	private static maxUnits: number

	private _textureUnit: number
	private _minFilter!: GL[TextureFilter]
	private _magFilter!: GL[TextureFilter]
	private _wrapS!: GL[TextureWrap]
	private _wrapT!: GL[TextureWrap]
	private _internalFormat!: GL[TextureFormat]
	private _format!: GL[TextureFormat]
	private _type!: GL[TextureType]

	initialized = false
	uniform: Uniform<'sampler2D'>
	texture: WebGLTexture
	size: number
	data: Float32Array

	constructor(
		private stage: Stage,
		options: TextureOptions,
	) {
		if (typeof Texture.maxUnits === 'undefined') {
			Texture.maxUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS)
			Texture.availableUnits = new Set(Array.from({ length: Texture.maxUnits }, (_, i) => i))
		}

		const unit = Texture.availableUnits.values().next().value
		if (typeof unit === 'undefined') {
			throw new Error('No available texture units')
		}

		Texture.availableUnits.delete(unit)
		this._textureUnit = unit

		this.data = options.data
		this.size = options.size ?? 1
		this.texture = this.gl.createTexture()!
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)

		this.minFilter = options.minFilter ?? 'NEAREST'
		this.magFilter = options.magFilter ?? 'NEAREST'
		this.wrapS = options.wrapS ?? 'CLAMP_TO_EDGE'
		this.wrapT = options.wrapT ?? 'CLAMP_TO_EDGE'
		this.format = options.format ?? 'RED'
		this.internalFormat = options.internalFormat ?? options?.format ?? 'R32F'
		this.type = options.type ?? 'FLOAT'

		this.uniform = stage.addUniform({
			name: options.name,
			type: 'sampler2D',
			// value: this._textureUnit,
			value: this.unit,
		})
	}

	init() {
		if (this.initialized) return
		this.initialized = true
		// console.log('Texture init()')
		// console.log('◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼')

		// this.gl.activeTexture(this.gl.TEXTURE0 + this.unit)
		// this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
		// this.gl.uniform1i(this.uniform.location, this.unit)

		// this.gl.texImage2D(
		// 	this.gl.TEXTURE_2D,
		// 	0,
		// 	this._internalFormat,
		// 	this.size,
		// 	this.size,
		// 	0,
		// 	this._format,
		// 	this._type,
		// 	this.data,
		// )
		this._updateTexture()

		// Check for WebGL errors
		const error = this.gl.getError()
		if (error !== this.gl.NO_ERROR) throw error
	}

	get gl(): GL {
		return this.stage.gl!
	}

	//#region Texture Parameters

	get minFilter(): GL[TextureFilter] {
		return this._minFilter
	}
	set minFilter(value: TextureFilter) {
		this._minFilter = this.gl[value]
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this._minFilter)
	}

	get magFilter(): GL[TextureFilter] {
		return this._magFilter
	}
	set magFilter(value: TextureFilter) {
		this._magFilter = this.gl[value]
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this._magFilter)
	}

	get wrapS(): GL[TextureWrap] {
		return this._wrapS
	}
	set wrapS(value: TextureWrap) {
		this._wrapS = this.gl[value]
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this._wrapS)
	}

	get wrapT(): GL[TextureWrap] {
		return this._wrapT
	}
	set wrapT(value: TextureWrap) {
		this._wrapT = this.gl[value]
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this._wrapT)
	}

	get format(): GL[TextureFormat] {
		return this._format
	}
	set format(value: TextureFormat) {
		this._format = this.gl[value]
	}

	get internalFormat(): GL[TextureFormat] {
		return this._internalFormat
	}
	set internalFormat(value: TextureFormat) {
		this._internalFormat = this.gl[value]
	}

	get type(): GL[TextureType] {
		return this._type
	}
	set type(value: TextureType) {
		this._type = this.gl[value]
	}
	//#endregion

	get unit(): number {
		return this._textureUnit
	}

	private _updateTexture(data = this.data): void {
		this.gl.activeTexture(this.gl.TEXTURE0 + this.unit)
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this._internalFormat,
			this.size,
			this.size,
			0,
			this._format,
			this._type,
			data,
		)
		// this.gl.uniform1i(this.uniform.location, this._textureUnit)
		this.uniform.update()
	}

	update(data?: Float32Array): void {
		if (this.disposed) {
			throw new Error('`Texture.update()` called on disposed texture.')
		}
		// this.data.set(data)
		// this.uniform.update()
		this._updateTexture(data)
	}

	_disposed = false
	get disposed() {
		return this._disposed
	}
	dispose(): void {
		this._disposed = true
		this.gl.deleteTexture(this.texture)
		Texture.availableUnits.add(this._textureUnit)
	}
}
