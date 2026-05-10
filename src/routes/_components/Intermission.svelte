<script lang="ts">
    import { t } from '$lib/i18n';

    const possibleTexts = [
        'intermission1',
        'intermission2',
        'intermission3',
        'intermission4',
        'intermission5',
        'intermission6',
        'intermission7',
        'intermission8',
        'intermission9'
    ]

    const getRandomText = () => {
        const index = Math.floor(Math.random() * possibleTexts.length);
        return possibleTexts[index] as
            | 'intermission1'
            | 'intermission2'
            | 'intermission3'
            | 'intermission4'
            | 'intermission5'
            | 'intermission6'
            | 'intermission7'
            | 'intermission8'
            | 'intermission9';
    }
</script>

<div class="bg-[#090909] min-h-screen w-full overflow-y-hidden select-none flex flex-col items-center justify-center gap-[56px] md:gap-[72px] p-[24px]">
    <img src="/illustrations/intermission_monster.png" alt="Intermission Monster" class="pointer-events-none" />

    <p class="font-poppins text-[32px] text-[#7B7B7B] text-center">{$t(getRandomText())}</p>

    <div class="h-[50px] w-[50px] rounded-full border-2 border-neutral-600 border-t-white animate-spin"></div>
</div>
