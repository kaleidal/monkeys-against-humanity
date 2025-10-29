<script lang="ts">
    import { supabase } from '../../util/supabase';
    import { session } from '../../util/session';

    let code: string = '';
    let loading = false;
    let errorMsg = '';

    function formatInput(v: string) {
        // Keep only A-Z and 0-9, insert hyphen after 3 chars, limit to 7 total (XXX-XXX)
        const raw = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        if (raw.length <= 3) return raw;
        return raw.slice(0, 3) + '-' + raw.slice(3);
    }
    function onCodeInput(e: Event) {
        const t = e.target as HTMLInputElement;
        code = formatInput(t.value);
    }

    async function getUsername(): Promise<string | null> {
        const userId = $session.user?.id;
        if (!userId) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
        if (error) {
            console.error('Error fetching username:', error);
            return null;
        }
        return data?.username ?? null;
    }

    async function joinLobby() {
        errorMsg = '';
        const normalized = formatInput(code);
        code = normalized;
        if (normalized.length !== 7 || normalized[3] !== '-') {
            errorMsg = 'Enter a 6-character code like ABC-123';
            return;
        }

        const user = $session.user;
        if (!user) {
            window.location.href = '/#/login';
            return;
        }

        loading = true;
        try {
            // Find lobby by code
            const { data: lobbyData, error: lobbyError } = await supabase
                .from('lobbies')
                .select('*')
                .eq('code', normalized)
                .single();

            if (lobbyError || !lobbyData) {
                errorMsg = lobbyError?.message || 'Lobby not found';
                loading = false;
                return;
            }

            if (lobbyData.status && lobbyData.status !== 'waiting') {
                errorMsg = 'This game has already started';
                loading = false;
                return;
            }

            const username = (await getUsername()) || 'Player';

            // Check if player already exists in this lobby
            const { data: existing, error: existErr } = await supabase
                .from('players')
                .select('id')
                .eq('lobby_id', lobbyData.id)
                .eq('user_id', user.id)
                .limit(1);
            if (existErr) {
                console.error('Error checking existing player:', existErr);
            }

            if (existing && existing.length > 0) {
                // Already in lobby: update username and proceed regardless of max players
                const { error: updateErr } = await supabase
                    .from('players')
                    .update({ username })
                    .eq('lobby_id', lobbyData.id)
                    .eq('user_id', user.id);
                if (updateErr) {
                    console.warn('Failed to update username, continuing:', updateErr.message);
                }
                window.location.href = `/#/lobby/${lobbyData.id}`;
                return;
            }

            // Enforce max players for new joins
            const limit: number = lobbyData.max_players ?? 8;
            if (Number.isFinite(limit) && limit > 0) {
                const { count, error: countErr } = await supabase
                    .from('players')
                    .select('id', { count: 'exact', head: true })
                    .eq('lobby_id', lobbyData.id);
                if (countErr) {
                    console.error('Error counting players:', countErr);
                } else if ((count ?? 0) >= limit) {
                    errorMsg = 'Lobby is full';
                    loading = false;
                    return;
                }
            }

            // Insert new player
            const { error: insertErr } = await supabase
                .from('players')
                .insert([{ lobby_id: lobbyData.id, user_id: user.id, username }]);
            if (insertErr) {
                errorMsg = insertErr.message || 'Failed to join lobby';
                loading = false;
                return;
            }

            // Navigate to the lobby overview page
            window.location.href = `/#/lobby/${lobbyData.id}`;
        } catch (e: any) {
            console.error(e);
            errorMsg = e?.message || 'Failed to join lobby';
        } finally {
            loading = false;
        }
    }
</script>

<div class="bg-[#090909] min-h-screen w-full overflow-hidden select-none flex items-center justify-center p-[6vw] md:p-[150px]">
    <img src="/illustrations/monsters_join_bottom.svg" alt="Login Monster" class="hidden md:block absolute bottom-0 left-0 pointer-events-none max-w-[40vw]" />
    <img src="/illustrations/monsters_join_top.svg" alt="Login Monster" class="hidden md:block absolute top-0 right-0 pointer-events-none max-w-[40vw]" />

    <div class="bg-[#141414] md:rotate-[5deg] w-[92vw] md:w-fit h-fit flex flex-col gap-[24px] md:gap-[40px] justify-center items-center p-[6vw] md:p-[80px]">
        <h1 class="font-medium text-[40px] md:text-[64px] text-white font-poppins">join a lobby</h1>
        <input
            type="text"
            placeholder="xxx - xxx"
            class="bg-[#1E1E1E] font-poppins w-full max-w-[520px] px-[20px] md:px-[40px] py-[16px] md:py-[20px] text-white text-[24px] md:text-[36px] focus:outline-none"
            value={code}
            on:input={onCodeInput}
            maxlength={7}
        />
        {#if errorMsg}
            <div class="text-red-400 font-poppins text-[14px] md:text-[18px] -mt-2 md:-mt-6">{errorMsg}</div>
        {/if}
        <button
            class="bg-[#E1FF00] px-[40px] md:px-[100px] py-[14px] md:py-[20px] cursor-pointer hover:rounded-full text-black font-poppins text-[40px] md:text-[64px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
            on:click={joinLobby}
        >
            {#if loading}joining…{/if}
            {#if !loading}join lobby{/if}
        </button>
    </div>
</div>
