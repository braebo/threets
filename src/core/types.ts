export type GL = WebGL2RenderingContext
export type QuerySelector = `#${string}` | `.${string}` | string

export type GLPrimitive =
	| WebGL2RenderingContext['BYTE']
	| WebGL2RenderingContext['UNSIGNED_BYTE']
	| WebGL2RenderingContext['UNSIGNED_BYTE']
	| WebGL2RenderingContext['SHORT']
	| WebGL2RenderingContext['UNSIGNED_SHORT']
	| WebGL2RenderingContext['INT']
	| WebGL2RenderingContext['UNSIGNED_INT']
	| WebGL2RenderingContext['HALF_FLOAT']
	| WebGL2RenderingContext['FLOAT']

export type GLMode =
	| WebGL2RenderingContext['TRIANGLES']
	| WebGL2RenderingContext['POINTS']
	| WebGL2RenderingContext['LINES']
	| WebGL2RenderingContext['LINE_STRIP']
	| WebGL2RenderingContext['LINE_LOOP']
	| WebGL2RenderingContext['TRIANGLE_STRIP']
	| WebGL2RenderingContext['TRIANGLE_FAN']
