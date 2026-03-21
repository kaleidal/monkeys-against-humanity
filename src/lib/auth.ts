import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { PUBLIC_AVE_CLIENT_ID } from '$env/static/public';
import { finishPkceLogin, startPkceLogin } from '@ave-id/sdk/client';
import { derived, get, writable } from 'svelte/store';

type AveUser = {
	id: string;
	handle?: string;
	displayName?: string;
	email?: string;
	avatarUrl?: string;
};

export type AveSession = {
	idToken: string;
	accessToken: string;
	expiresAt: number;
	user: AveUser;
};

type GuestSession = {
	guestId: string;
	guestSecret: string;
	name: string;
};

const SESSION_KEY = 'mah.ave-session';
const GUEST_KEY = 'mah.guests';
const RETURN_TO_KEY = 'mah.return-to';
const LEGACY_GUEST_KEY = 'mah.guests';

function readJson<T>(key: string): T | null {
	if (!browser) return null;
	const raw = localStorage.getItem(key);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		localStorage.removeItem(key);
		return null;
	}
}

function isExpired(session: AveSession | null) {
	return !session || session.expiresAt <= Date.now() + 30_000;
}

function loadStoredSession() {
	const stored = readJson<AveSession>(SESSION_KEY);
	if (isExpired(stored)) {
		if (browser) localStorage.removeItem(SESSION_KEY);
		return null;
	}
	return stored;
}

function persistSession(session: AveSession | null) {
	if (!browser) return;
	if (!session) {
		localStorage.removeItem(SESSION_KEY);
		return;
	}
	localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadGuests() {
	if (!browser) return {};

	const raw = sessionStorage.getItem(GUEST_KEY);
	if (raw) {
		try {
			return JSON.parse(raw) as Record<string, GuestSession>;
		} catch {
			sessionStorage.removeItem(GUEST_KEY);
		}
	}

	return {};
}

function persistGuests(value: Record<string, GuestSession>) {
	if (!browser) return;
	sessionStorage.setItem(GUEST_KEY, JSON.stringify(value));
	localStorage.removeItem(LEGACY_GUEST_KEY);
}

export const auth = writable({
	ready: !browser,
	session: browser ? loadStoredSession() : null as AveSession | null
});

export const currentUser = derived(auth, ($auth) => $auth.session?.user ?? null);
export const isSignedIn = derived(auth, ($auth) => Boolean($auth.session));

if (browser) {
	auth.set({ ready: true, session: loadStoredSession() });
}

function redirectUri() {
	return `${window.location.origin}/auth/callback`;
}

function aveClientId() {
	return PUBLIC_AVE_CLIENT_ID || '';
}

export async function signIn(returnTo = `${window.location.pathname}${window.location.search}`) {
	const clientId = aveClientId();
	if (!clientId) {
		throw new Error('Missing PUBLIC_AVE_CLIENT_ID');
	}

	sessionStorage.setItem(RETURN_TO_KEY, returnTo);

	await startPkceLogin({
		clientId,
		redirectUri: redirectUri(),
		scope: 'openid profile email'
	});
}

export async function completeSignIn() {
	const clientId = aveClientId();
	if (!clientId) {
		throw new Error('Missing PUBLIC_AVE_CLIENT_ID');
	}

	const tokens = await finishPkceLogin({
		clientId,
		redirectUri: redirectUri()
	});

	if (!tokens?.id_token || !tokens.user) {
		throw new Error('Sign in did not return an id token');
	}

	const session: AveSession = {
		idToken: tokens.id_token,
		accessToken: tokens.access_token_jwt,
		expiresAt: Date.now() + tokens.expires_in * 1000,
		user: {
			id: tokens.user.id,
			handle: tokens.user.handle,
			displayName: tokens.user.displayName,
			email: tokens.user.email,
			avatarUrl: tokens.user.avatarUrl
		}
	};

	persistSession(session);
	auth.set({ ready: true, session });

	const returnTo = sessionStorage.getItem(RETURN_TO_KEY) || '/';
	sessionStorage.removeItem(RETURN_TO_KEY);

	await goto(returnTo, { replaceState: true });
}

export async function signOut() {
	persistSession(null);
	auth.set({ ready: true, session: null });
	await goto('/');
}

export function getGuestSession(lobbyId: string) {
	return loadGuests()[lobbyId] || null;
}

export function createGuestSession(name: string) {
	return {
		guestId: crypto.randomUUID(),
		guestSecret: crypto.randomUUID(),
		name
	};
}

export function saveGuestSession(lobbyId: string, session: GuestSession) {
	const guests = loadGuests();
	guests[lobbyId] = session;
	persistGuests(guests);
}

export function clearGuestSession(lobbyId: string) {
	const guests = loadGuests();
	delete guests[lobbyId];
	persistGuests(guests);
}

export function getSessionSnapshot() {
	return get(auth).session;
}
