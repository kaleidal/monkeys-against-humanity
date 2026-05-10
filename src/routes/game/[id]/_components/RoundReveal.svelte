<script lang="ts">
    import { t } from '$lib/i18n';

    export let submissions: Array<{
        id: string;
        answer: string;
        player_user_id: string;
    }> = [];
    export let winningId: string | null = null;
    export let players: Array<{
        user_id: string;
        username: string;
        score?: number | null;
    }> = [];
    export let onNext: () => void = () => {};
    export let loading: boolean = false;
    export let errorMsg: string = '';
    export let prompt: string = '';
    export let canContinue: boolean = false;

    $: winnerSubmission = submissions.find((s) => s.id === winningId);
    $: winnerPlayer = winnerSubmission
        ? players.find((p) => p.user_id === winnerSubmission.player_user_id)
        : null;
</script>

<div class="w-full min-h-screen bg-[#090909] text-white p-[24px] md:p-[40px] flex flex-col md:flex-row justify-center gap-8 md:gap-10 items-center overflow-x-hidden">
    {#if winningId && winnerSubmission && winnerPlayer}
        <div class="w-full max-w-[520px] h-[300px] md:h-[340px] mb-4 md:mb-0 flex flex-row justify-center">
            <div class="h-[300px] md:h-[340px] w-[190px] md:w-[220px] top-4 left-2 bg-[#E1FF00] text-black rounded-[24px] md:rounded-[28px] font-poppins font-medium p-[20px] md:p-[28px] text-[18px] md:text-[22px] z-10">
                {prompt}
            </div>

            <div class="mt-[16%] -ml-[8%] h-[300px] md:h-[340px] w-[190px] md:w-[220px] top-12 left-12 rotate-[20deg] bg-white text-black rounded-[24px] md:rounded-[28px] p-[20px] md:p-[28px] font-poppins font-medium text-[18px] md:text-[22px] z-20">
                {winnerSubmission.answer}
            </div>
        </div>

        <div class="inset-0 flex flex-col items-center justify-center">
          <span class="text-[44px] md:text-[62px] leading-tight text-center font-poppins w-full max-w-[560px] font-medium text-white">
            {$t('roundRevealWinsRound', { name: winnerPlayer.username })}
          </span>

            {#if canContinue}
                <button
                    class="bg-[#E1FF00] w-full max-w-[560px] z-100 px-[40px] py-[14px] md:py-[16px] cursor-pointer hover:rounded-full text-black font-poppins text-[40px] md:text-[48px] flex items-center justify-center tracking-wide active:scale-[0.98] ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                    onclick={onNext}
                >
                    {loading ? $t('roundRevealStarting') : $t('roundRevealNextRound')}
                </button>
                {#if errorMsg}
                    <span class="text-red-400 text-sm font-mono">{errorMsg}</span>
                {/if}
            {/if}
        </div>
    {/if}
</div>
