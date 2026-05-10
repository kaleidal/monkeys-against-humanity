export function getDisplayError(error: unknown, fallback: string) {
	const raw =
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: fallback;

	const uncaughtMatch = raw.match(/Uncaught Error:\s*(.+?)(?=\s+at handler|\s+Called by client|$)/is);
	if (uncaughtMatch?.[1]) {
		return uncaughtMatch[1].trim();
	}

	const cleaned = raw
		.replace(/\[[^\]]+\]\s*/g, ' ')
		.replace(/Server Error\s*/i, '')
		.replace(/\s+at handler.*$/is, '')
		.replace(/\s+Called by client.*$/is, '')
		.trim();

	return cleaned || fallback;
}
