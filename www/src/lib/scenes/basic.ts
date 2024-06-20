import { Stage } from 'threets'

export async function basicScene(canvasId: string) {
	const stage = new Stage({
		canvas: canvasId,
	})
	stage.addSimpleQuad()

	// After your WebGL calls
	let error = stage.gl?.getError()
	if (error != stage.gl?.NO_ERROR) {
		console.error('WebGL Error: ' + error)
	}

	stage.render()

	return stage
}
