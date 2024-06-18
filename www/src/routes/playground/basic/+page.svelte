<script lang="ts">
	import type { Stage } from 'threets'

	import { basicScene } from '$lib/scenes/basic'
	import { onDestroy, onMount } from 'svelte'

	let stage: Stage

	onMount(async () => {
		stage = await basicScene()
	})

	onDestroy(() => {
		globalThis.window?.location.reload()
	})
</script>

<button on:click={() => console.log(stage)}>log(stage)</button>
<button on:click={() => console.log((stage.canvas.width = stage?.canvas.width - 1))}>wat</button>

<style lang="scss">
	button {
		margin: 0.5rem auto;
		width: 10rem;
	}

	:global(#app canvas) {
		width: 90%;
		border-radius: 1rem;
		margin: 1rem auto;
	}
</style>
