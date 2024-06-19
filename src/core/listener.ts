/**
 * A callback that can be added to a ticker.
 */
export type EventCallback<T extends any[] = any[]> = (...args: T) => void

/**
 * A linked-list node with a callback function.
 *
 * Original source from {@link https://github.com/pixijs/pixijs/blob/dev/src/ticker/TickerListener.ts|pixijs}
 */
export class LinkedListener<T extends any[] = any[]> {
	next: LinkedListener<T> | null = null
	previous: LinkedListener<T> | null = null

	private _disposed = false

	constructor(
		public cb: EventCallback<T> | null,
		public ctx: any = this,
		private readonly once = false,
	) {}

	/**
	 * Emit by calling the current callback function.
	 * @param evm - The {@link EventManager} emitting.
	 * @returns The next listener.
	 */
	emit(...args: T): LinkedListener | null {
		this.assertNotDisposed()
		if (this.cb) {
			if (this.ctx) {
				this.cb.call(this.ctx, ...args)
			} else {
				;(this as LinkedListener<any>).cb!(...args)
			}
		}

		const redirect = this.next

		if (this.once) this.dispose()

		return redirect
	}

	/**
	 * Connect to the list.
	 * @param previous - Input node, previous listener
	 */
	connect(previous: LinkedListener): void {
		this.assertNotDisposed()
		this.previous = previous
		if (previous.next) {
			previous.next.previous = this
		}
		this.next = previous.next
		previous.next = this
	}

	assertNotDisposed(): void {
		if (this._disposed) throw new Error('Illegal call to disposed LinkedListener.')
	}

	disconnect(): void {
		if (this.previous) {
			this.previous.next = this.next
		}
		if (this.next) {
			this.next.previous = this.previous
		}
		this.next = null
		this.previous = null
	}

	dispose() {
		this.assertNotDisposed()
		this._disposed = true
		this.cb = null

		// Disconnect, hook up next and previous
		if (this.previous) {
			this.previous.next = this.next
		}

		if (this.next) {
			this.next.previous = this.previous
		}

		// Redirect to the next item
		const redirect = this.next

		// Remove references
		this.next = null
		this.previous = null

		return redirect
	}
}
