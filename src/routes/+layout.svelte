<script lang="ts">
	import './layout.css';
	import { setupConvex, useConvexClient } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { auth } from '$lib/auth';
	import { api } from '$lib/convexApi';
	import LanguageSelect from '../components/LanguageSelect.svelte';

	const convexUrl = PUBLIC_CONVEX_URL || '';

	if (convexUrl) {
		setupConvex(convexUrl);
	}

	const convex = convexUrl ? useConvexClient() : null;
	let syncedUser = '';

	$: if (convex) {
		convex.setAuth(async () => ($auth.session?.idToken ? $auth.session.idToken : null));
	}

	$: if (convex && $auth.session?.idToken && syncedUser !== $auth.session.user.id) {
		syncedUser = $auth.session.user.id;
		convex.mutation(api.users.syncProfile, {}).catch(() => {
			syncedUser = '';
		});
	}

	$: if (!$auth.session) {
		syncedUser = '';
	}
</script>

<svelte:head>
	<title>Monkeys Against Humanity</title>
</svelte:head>

<LanguageSelect />
<slot />
