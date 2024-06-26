export function prettyPrint(data: any) {
	return JSON.stringify(data, null, 2).replaceAll(/"/g, '')
}

export function prettyPrintKeys<T extends Record<string, any>, K extends keyof T>(
	obj: T,
	keys: Array<K | (string & {})>,
	title = '',
) {
	const str = prettyPrint(
		keys.reduce(
			(acc, key) => {
				// @ts-expect-error
				acc[key] = obj[key]
				return acc
			},
			{} as Pick<T, K>,
		),
	)

	return title ? `\n${title} ` + str : str
}
