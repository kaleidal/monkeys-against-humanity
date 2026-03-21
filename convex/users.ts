import { mutationGeneric } from 'convex/server';

async function getIdentity(ctx: any) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error('Please sign in');
	}
	return identity;
}

export const syncProfile = mutationGeneric({
	args: {},
	handler: async (ctx) => {
		const identity = await getIdentity(ctx);
		const existing = await ctx.db
			.query('users')
			.withIndex('by_external_id', (q: any) => q.eq('externalId', identity.subject))
			.unique();

		const values = {
			externalId: identity.subject,
			name:
				(identity.name as string | undefined) ||
				(identity.preferred_username as string | undefined) ||
				'Player',
			handle: identity.preferred_username as string | undefined,
			email: identity.email as string | undefined,
			avatarUrl: identity.picture as string | undefined
		};

		if (existing) {
			await ctx.db.patch(existing._id, values);
			return existing._id;
		}

		return await ctx.db.insert('users', values);
	}
});
