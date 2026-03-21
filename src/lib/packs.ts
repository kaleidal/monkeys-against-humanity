const modules = import.meta.glob('/src/packs/*.ts', { eager: true });

export type PackDefinition = {
	key: string;
	name: string;
	prompts: string[];
	answers: string[];
};

export const packs: PackDefinition[] = Object.entries(modules).map(([path, mod]) => {
	const key = (path.split('/').pop() || '').replace('.ts', '');
	const data = mod as { prompts?: string[]; answers?: string[] };

	return {
		key,
		name: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
		prompts: data.prompts || [],
		answers: data.answers || []
	};
});

export function getPackBackground(key: string) {
	return `/card_packs/${key}.png`;
}
