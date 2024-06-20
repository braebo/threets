//? Core

export { Uniform, type UniformOptions, type UniformValueType } from './core/Uniform'
export { BufferGeometry, type BufferGeometryOptions } from './core/BufferGeometry'
export { Transform, type TransformOptions } from './core/Transform'
export { Camera, type CameraOptions } from './core/Camera'
export { Stage, type StageOptions } from './core/Stage'
export { Vector2, type Vec2 } from './core/Vector2'
export { Vector3, type Vec3 } from './core/Vector3'
export { Matrix4, type Mat4 } from './core/Matrix'

//? Controllers

export { WASDController } from './WASDController'
export { OrbitController } from './OrbitController'

//? Utils

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
