<script lang="ts">
    import { t } from '$lib/i18n';

    export let prompt: string | null = '';
    export let players: Array<{ username: string; user_id: string; score?: number }> = [];
    export let tsarUuid: string = '';
    export let submittedIds: string[] = [];
</script>

<div class="w-full min-h-screen bg-[#090909] text-white p-[24px] md:p-[48px] flex flex-col items-center md:items-stretch md:flex-row gap-[24px] md:gap-[6vw] lg:overflow-hidden">
    <section class="flex flex-col gap-3 bg-neutral-900 p-[24px] md:p-[32px] w-full md:w-[22vw] md:self-stretch overflow-y-auto">
        <h1 class="text-[24px] md:text-[32px] font-normal font-poppins">{$t('tsarWaitingPlayers')}</h1>
        {#each players as player}
            <div class="flex flex-row justify-between items-center bg-[#282828] px-4 py-2">
                <div class="flex items-center gap-2">
                    <h1 class="text-lg md:text-2xl font-normal font-poppins">{player.username}</h1>
                </div>
                <div class="flex items-center gap-2">
                    {#if player.user_id === tsarUuid}
                        <img src="/icons/tsar.svg" alt="tsar crown" class="w-[20px] h-[20px] md:w-[24px] md:h-[24px] pointer-events-none select-none" />
                    {/if}
                    {#if submittedIds.includes(player.user_id)}
                        <svg width="20" height="20" viewBox="0 0 34 34" fill="none">
                            <path d="M28.3332 8.5L12.7498 24.0833L5.6665 17" stroke="#E1FF00" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    {:else if player.user_id !== tsarUuid}
                        <svg width="20" height="20" viewBox="0 0 34 34" fill="none">
                            <g clip-path="url(#clip0)"><path d="M17.0002 8.50001V17L22.6668 19.8333M31.1668 17C31.1668 24.824 24.8242 31.1667 17.0002 31.1667C9.17613 31.1667 2.8335 24.824 2.8335 17C2.8335 9.17598 9.17613 2.83334 17.0002 2.83334C24.8242 2.83334 31.1668 9.17598 31.1668 17Z" stroke="#EB9F11" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
                            <defs><clipPath id="clip0"><rect width="34" height="34" fill="white"/></clipPath></defs>
                        </svg>
                    {/if}
                </div>
            </div>
        {/each}
    </section>

    <div class="h-full w-full md:w-[60vw] flex flex-col items-center justify-center gap-[24px] md:gap-[36px]">
        <div class="h-[260px] md:h-[320px] w-[200px] md:w-[240px] bg-[#E1FF00] rounded-[24px] md:rounded-[32px] flex items-start justify-start p-6 md:p-[28px] text-left">
            <p class="text-[18px] md:text-[24px] font-poppins text-black font-medium">{prompt || $t('tsarWaitingFallback')}</p>
        </div>

        <h1 class="text-[24px] md:text-[32px] text-white font-poppins font-medium text-center">{$t('tsarWaitingMessage')}</h1>
    </div>
</div>
