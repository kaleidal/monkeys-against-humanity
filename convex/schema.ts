import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	users: defineTable({
		externalId: v.string(),
		name: v.string(),
		handle: v.optional(v.string()),
		email: v.optional(v.string()),
		avatarUrl: v.optional(v.string())
	}).index('by_external_id', ['externalId']),

	lobbies: defineTable({
		code: v.string(),
		hostUserId: v.id('users'),
		hostIdentityId: v.string(),
		status: v.union(v.literal('waiting'), v.literal('in_game'), v.literal('finished')),
		maxPlayers: v.number(),
		maxRounds: v.number(),
		allowAnonymous: v.boolean(),
		cardPacks: v.array(v.string()),
		currentRoundId: v.optional(v.id('rounds')),
		createdAt: v.number(),
		lastActivityAt: v.number()
	})
		.index('by_code', ['code'])
		.index('by_host', ['hostUserId']),

	players: defineTable({
		lobbyId: v.id('lobbies'),
		userId: v.optional(v.id('users')),
		identityId: v.optional(v.string()),
		guestId: v.optional(v.string()),
		guestSecret: v.optional(v.string()),
		username: v.string(),
		score: v.number(),
		isHost: v.boolean(),
		isAnonymous: v.boolean(),
		joinedAt: v.number()
	})
		.index('by_lobby', ['lobbyId'])
		.index('by_lobby_identity', ['lobbyId', 'identityId'])
		.index('by_lobby_guest', ['lobbyId', 'guestId']),

	rounds: defineTable({
		lobbyId: v.id('lobbies'),
		roundNumber: v.number(),
		tsarPlayerId: v.id('players'),
		prompt: v.optional(v.string()),
		status: v.union(
			v.literal('tsar_select'),
			v.literal('submitting'),
			v.literal('judging'),
			v.literal('reveal')
		),
		winningSubmissionId: v.optional(v.id('submissions')),
		createdAt: v.number()
	})
		.index('by_lobby', ['lobbyId'])
		.index('by_lobby_round', ['lobbyId', 'roundNumber']),

	submissions: defineTable({
		lobbyId: v.id('lobbies'),
		roundId: v.id('rounds'),
		playerId: v.id('players'),
		answer: v.string(),
		createdAt: v.number()
	})
		.index('by_round', ['roundId'])
		.index('by_round_player', ['roundId', 'playerId'])
});
