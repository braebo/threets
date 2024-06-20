//? Controllers

export { WASDController } from './WASDController'

//? Core

export type { TransformOptions } from './core/transform'
export { Transform } from './core/transform'

export type { CameraOptions } from './core/camera'
export { Camera } from './core/camera'

export type { Vec2, Vec3 } from './core/vectors'
export { Vector3 } from './core/vectors'

export type { UniformOptions, UniformValueType } from './core/uniform'
export { Uniform } from './core/uniform'

export type { Mat4 } from './core/matrix'
export { Matrix4 } from './core/matrix'

export type { BufferGeometryOptions } from './core/geometry'
export { BufferGeometry } from './core/geometry'

export type { StageOptions } from './core/stage'
export { Stage } from './core/stage'

export {
	subtractVectors,
	cross_arr,
	normalize,
	degToRad,
	radToDeg,
	select,
	cross,
} from './core/utils'

export type { QuerySelector, GL, GLMode, GLPrimitive } from './core/types'