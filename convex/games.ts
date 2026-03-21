import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';

type Identity = {
	subject: string;
	name?: string;
	preferred_username?: string;
	email?: string;
	picture?: string;
};

function makeCode() {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let result = '';
	for (let index = 0; index < 6; index += 1) {
		if (index === 3) result += '-';
		result += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return result;
}

async function requireIdentity(ctx: any): Promise<Identity> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error('Please sign in');
	}
	return identity as Identity;
}

async function upsertUser(ctx: any, identity: Identity) {
	const existing = await ctx.db
		.query('users')
		.withIndex('by_external_id', (q: any) => q.eq('externalId', identity.subject))
		.unique();

	if (existing) {
		await ctx.db.patch(existing._id, {
			name: identity.name || identity.preferred_username || existing.name,
			handle: identity.preferred_username,
			email: identity.email,
			avatarUrl: identity.picture
		});
		return existing;
	}

	const userId = await ctx.db.insert('users', {
		externalId: identity.subject,
		name: identity.name || identity.preferred_username || 'Player',
		handle: identity.preferred_username,
		email: identity.email,
		avatarUrl: identity.picture
	});

	return await ctx.db.get(userId);
}

async function getLobbyOrThrow(ctx: any, lobbyId: string) {
	const lobby = await ctx.db.get(lobbyId);
	if (!lobby) throw new Error('Lobby not found');
	return lobby;
}

async function getPlayers(ctx: any, lobbyId: string) {
	return await ctx.db
		.query('players')
		.withIndex('by_lobby', (q: any) => q.eq('lobbyId', lobbyId))
		.collect();
}

async function resolveViewer(ctx: any, lobbyId: string, guestId?: string, guestSecret?: string) {
	const identity = await ctx.auth.getUserIdentity();

	if (identity) {
		const player = await ctx.db
			.query('players')
			.withIndex('by_lobby_identity', (q: any) =>
				q.eq('lobbyId', lobbyId).eq('identityId', identity.subject)
			)
			.unique();

		if (player) return player;
	}

	if (!guestId || !guestSecret) return null;

	const guest = await ctx.db
		.query('players')
		.withIndex('by_lobby_guest', (q: any) => q.eq('lobbyId', lobbyId).eq('guestId', guestId))
		.unique();

	if (!guest || guest.guestSecret !== guestSecret) return null;
	return guest;
}

async function getCurrentRound(ctx: any, lobby: any) {
	if (!lobby.currentRoundId) return null;
	return await ctx.db.get(lobby.currentRoundId);
}

function orderPlayers(players: any[]) {
	return [...players].sort((left, right) => left.joinedAt - right.joinedAt);
}

function nextTsar(players: any[], roundNumber: number) {
	const ordered = orderPlayers(players);
	return ordered[(roundNumber - 1) % ordered.length] || null;
}

async function ensureLobbyPlayerLimit(ctx: any, lobby: any) {
	const players = await getPlayers(ctx, lobby._id);
	if (players.length >= lobby.maxPlayers) {
		throw new Error('Lobby is full');
	}
}

async function createRound(ctx: any, lobby: any, roundNumber: number) {
	const players = await getPlayers(ctx, lobby._id);
	const tsar = nextTsar(players, roundNumber);
	if (!tsar) throw new Error('Need at least one player to start');

	const roundId = await ctx.db.insert('rounds', {
		lobbyId: lobby._id,
		roundNumber,
		tsarPlayerId: tsar._id,
		status: 'tsar_select',
		createdAt: Date.now()
	});

	await ctx.db.patch(lobby._id, {
		currentRoundId: roundId,
		status: 'in_game'
	});

	return roundId;
}

export const createLobby = mutationGeneric({
	args: {
		maxPlayers: v.number(),
		maxRounds: v.number(),
		allowAnonymous: v.boolean(),
		cardPacks: v.array(v.string())
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const user = await upsertUser(ctx, identity);

		let code = makeCode();
		while (
			await ctx.db
				.query('lobbies')
				.withIndex('by_code', (q: any) => q.eq('code', code))
				.unique()
		) {
			code = makeCode();
		}

		const lobbyId = await ctx.db.insert('lobbies', {
			code,
			hostUserId: user._id,
			hostIdentityId: identity.subject,
			status: 'waiting',
			maxPlayers: args.maxPlayers,
			maxRounds: args.maxRounds,
			allowAnonymous: args.allowAnonymous,
			cardPacks: args.cardPacks,
			createdAt: Date.now()
		});

		await ctx.db.insert('players', {
			lobbyId,
			userId: user._id,
			identityId: identity.subject,
			username: user.name,
			score: 0,
			isHost: true,
			isAnonymous: false,
			joinedAt: Date.now()
		});

		return lobbyId;
	}
});

export const joinLobby = mutationGeneric({
	args: {
		code: v.string(),
		guestId: v.optional(v.string()),
		guestSecret: v.optional(v.string()),
		guestName: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const lobby = await ctx.db
			.query('lobbies')
			.withIndex('by_code', (q: any) => q.eq('code', args.code))
			.unique();

		if (!lobby) throw new Error('Lobby not found');
		if (lobby.status !== 'waiting') throw new Error('This game has already started');

		const identity = (await ctx.auth.getUserIdentity()) as Identity | null;

		if (identity) {
			const user = await upsertUser(ctx, identity);
			const existing = await ctx.db
				.query('players')
				.withIndex('by_lobby_identity', (q: any) =>
					q.eq('lobbyId', lobby._id).eq('identityId', identity.subject)
				)
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, { username: user.name });
				return lobby._id;
			}

			await ensureLobbyPlayerLimit(ctx, lobby);
			await ctx.db.insert('players', {
				lobbyId: lobby._id,
				userId: user._id,
				identityId: identity.subject,
				username: user.name,
				score: 0,
				isHost: false,
				isAnonymous: false,
				joinedAt: Date.now()
			});

			return lobby._id;
		}

		if (!lobby.allowAnonymous) {
			throw new Error('This lobby requires sign in');
		}

		if (!args.guestId || !args.guestSecret) {
			throw new Error('Guest session missing');
		}

		const name = args.guestName?.trim() || 'Player';
		const existingGuest = await ctx.db
			.query('players')
			.withIndex('by_lobby_guest', (q: any) => q.eq('lobbyId', lobby._id).eq('guestId', args.guestId))
			.unique();

		if (existingGuest) {
			if (existingGuest.guestSecret !== args.guestSecret) {
				throw new Error('Guest session mismatch');
			}

			await ctx.db.patch(existingGuest._id, { username: name });
			return lobby._id;
		}

		await ensureLobbyPlayerLimit(ctx, lobby);
		await ctx.db.insert('players', {
			lobbyId: lobby._id,
			guestId: args.guestId,
			guestSecret: args.guestSecret,
			username: name,
			score: 0,
			isHost: false,
			isAnonymous: true,
			joinedAt: Date.now()
		});

		return lobby._id;
	}
});

export const updateLobbySettings = mutationGeneric({
	args: {
		lobbyId: v.id('lobbies'),
		maxPlayers: v.number(),
		maxRounds: v.number(),
		allowAnonymous: v.boolean(),
		cardPacks: v.array(v.string())
	},
	handler: async (ctx, args) => {
		const viewer = await resolveViewer(ctx, args.lobbyId, undefined, undefined);
		if (!viewer?.isHost) {
			throw new Error('Only the host can change settings');
		}

		await ctx.db.patch(args.lobbyId, {
			maxPlayers: args.maxPlayers,
			maxRounds: args.maxRounds,
			allowAnonymous: args.allowAnonymous,
			cardPacks: args.cardPacks
		});
	}
});

export const startGame = mutationGeneric({
	args: {
		lobbyId: v.id('lobbies')
	},
	handler: async (ctx, args) => {
		const lobby = await getLobbyOrThrow(ctx, args.lobbyId);
		const viewer = await resolveViewer(ctx, args.lobbyId, undefined, undefined);

		if (!viewer?.isHost) {
			throw new Error('Only the host can start the game');
		}

		const players = await getPlayers(ctx, args.lobbyId);
		if (players.length < 3) {
			throw new Error('Need at least 3 players to start');
		}

		if (!lobby.currentRoundId) {
			await createRound(ctx, lobby, 1);
		} else {
			await ctx.db.patch(lobby._id, { status: 'in_game' });
		}
	}
});

export const selectPrompt = mutationGeneric({
	args: {
		lobbyId: v.id('lobbies'),
		prompt: v.string(),
		guestId: v.optional(v.string()),
		guestSecret: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const lobby = await getLobbyOrThrow(ctx, args.lobbyId);
		const round = await getCurrentRound(ctx, lobby);
		const viewer = await resolveViewer(ctx, args.lobbyId, args.guestId, args.guestSecret);

		if (!round || !viewer || round.tsarPlayerId !== viewer._id) {
			throw new Error('Only the tsar can choose the prompt');
		}

		await ctx.db.patch(round._id, {
			prompt: args.prompt,
			status: 'submitting'
		});
	}
});

export const submitAnswer = mutationGeneric({
	args: {
		lobbyId: v.id('lobbies'),
		answer: v.string(),
		guestId: v.optional(v.string()),
		guestSecret: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const lobby = await getLobbyOrThrow(ctx, args.lobbyId);
		const round = await getCurrentRound(ctx, lobby);
		const viewer = await resolveViewer(ctx, args.lobbyId, args.guestId, args.guestSecret);

		if (!round || !viewer) {
			throw new Error('Player not found');
		}

		if (viewer._id === round.tsarPlayerId) {
			throw new Error('The tsar cannot submit a card');
		}

		const existing = await ctx.db
			.query('submissions')
			.withIndex('by_round_player', (q: any) => q.eq('roundId', round._id).eq('playerId', viewer._id))
			.unique();

		if (existing) {
			return existing._id;
		}

		const submissionId = await ctx.db.insert('submissions', {
			lobbyId: args.lobbyId,
			roundId: round._id,
			playerId: viewer._id,
			answer: args.answer,
			createdAt: Date.now()
		});

		const players = await getPlayers(ctx, args.lobbyId);
		const submissions = await ctx.db
			.query('submissions')
			.withIndex('by_round', (q: any) => q.eq('roundId', round._id))
			.collect();

		if (submissions.length >= Math.max(0, players.length - 1)) {
			await ctx.db.patch(round._id, { status: 'judging' });
		}

		return submissionId;
	}
});

export const pickWinner = mutationGeneric({
	args: {
		lobbyId: v.id('lobbies'),
		submissionId: v.id('submissions'),
		guestId: v.optional(v.string()),
		guestSecret: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const lobby = await getLobbyOrThrow(ctx, args.lobbyId);
		const round = await getCurrentRound(ctx, lobby);
		const viewer = await resolveViewer(ctx, args.lobbyId, args.guestId, args.guestSecret);
		const submission = await ctx.db.get(args.submissionId);

		if (!round || !viewer || !submission || round.tsarPlayerId !== viewer._id) {
			throw new Error('Only the tsar can pick a winner');
		}

		const winner = await ctx.db.get(submission.playerId);
		if (!winner) throw new Error('Winner not found');

		await ctx.db.patch(winner._id, {
			score: winner.score + 1
		});

		await ctx.db.patch(round._id, {
			status: 'reveal',
			winningSubmissionId: submission._id
		});
	}
});

export const advanceRound = mutationGeneric({
	args: {
		lobbyId: v.id('lobbies'),
		guestId: v.optional(v.string()),
		guestSecret: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const lobby = await getLobbyOrThrow(ctx, args.lobbyId);
		const viewer = await resolveViewer(ctx, args.lobbyId, args.guestId, args.guestSecret);
		const round = await getCurrentRound(ctx, lobby);

		if (!viewer?.isHost) {
			throw new Error('Only the host can continue');
		}

		if (!round) {
			throw new Error('Round not found');
		}

		if (round.roundNumber >= lobby.maxRounds) {
			await ctx.db.patch(lobby._id, { status: 'finished' });
			return;
		}

		await createRound(ctx, lobby, round.roundNumber + 1);
	}
});

export const getLobbyState = queryGeneric({
	args: {
		lobbyId: v.id('lobbies'),
		guestId: v.optional(v.string()),
		guestSecret: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const lobby = await getLobbyOrThrow(ctx, args.lobbyId);
		const players = orderPlayers(await getPlayers(ctx, args.lobbyId));
		const round = await getCurrentRound(ctx, lobby);
		const submissions = round
			? await ctx.db
					.query('submissions')
					.withIndex('by_round', (q: any) => q.eq('roundId', round._id))
					.collect()
			: [];
		const viewer = await resolveViewer(ctx, args.lobbyId, args.guestId, args.guestSecret);

		return {
			lobby: {
				id: lobby._id,
				code: lobby.code,
				status: lobby.status,
				maxPlayers: lobby.maxPlayers,
				maxRounds: lobby.maxRounds,
				allowAnonymous: lobby.allowAnonymous,
				cardPacks: lobby.cardPacks
			},
			players: players.map((player) => ({
				id: player._id,
				username: player.username,
				score: player.score,
				isHost: player.isHost,
				isAnonymous: player.isAnonymous
			})),
			viewer: viewer
				? {
						playerId: viewer._id,
						isHost: viewer.isHost,
						isAnonymous: viewer.isAnonymous,
						username: viewer.username
					}
				: null,
			currentRound: round
				? {
						id: round._id,
						roundNumber: round.roundNumber,
						tsarPlayerId: round.tsarPlayerId,
						prompt: round.prompt || null,
						status: round.status,
						winningSubmissionId: round.winningSubmissionId || null
					}
				: null,
			submissions: submissions.map((submission) => ({
				id: submission._id,
				playerId: submission.playerId,
				answer: submission.answer
			}))
		};
	}
});
