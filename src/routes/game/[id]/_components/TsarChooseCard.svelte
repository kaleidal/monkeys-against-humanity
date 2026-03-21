<script lang="ts">
    import { t } from '$lib/i18n';

    let { packsKeys = [] as string[], onSelect = ((_: string) => {}) } = $props();

    const modules = import.meta.glob('/src/packs/*.ts', { eager: true });

    const packs = Object.keys(modules).map((path) => {
        const name = (path.split('/').pop() || '').replace('.ts', '');
        return { name, data: modules[path] as any };
    });

    function getPromptsFromSelected(): string[] {
        let all: string[] = [];
        for (const p of packs) {
            if (packsKeys.includes(p.name)) all = all.concat((p.data.prompts || []) as string[]);
        }
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        return all.slice(0, 5);
    }

    let selectedPrompts = getPromptsFromSelected();

    function choose(card: string) {
        onSelect(card);
    }
</script>

<div class="w-full min-h-screen bg-[#090909] flex flex-col items-center justify-center gap-[28px] md:gap-[40px] p-[24px] md:p-[40px] relative overflow-hidden select-none">
    <div class="flex flex-col items-center justify-center gap-[12px] md:gap-[16px]">
        <h1 class="text-[44px] md:text-[52px] font-normal text-white font-poppins self-center">{$t('tsarChooseTitle')}</h1>
        <h1 class="text-[28px] font-normal text-white font-poppins self-center">{$t('tsarChooseSubtitle')}</h1>
    </div>

    <div class="flex flex-row flex-wrap justify-center gap-[16px] md:gap-[20px] w-full max-w-[1200px]">
        {#each selectedPrompts as card}
            <button
                class="flex-grow basis-[180px] md:basis-[200px] max-w-[230px] h-[260px] md:h-[320px] bg-[#E1FF00] rounded-[28px] md:rounded-[32px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-[1.05] hover:rotate-[-3deg] transition-all duration-300 active:scale-[0.95] ease-in-out flex items-start justify-start p-[20px] md:p-[28px] text-left"
                onclick={() => choose(card)}
            >
                <p class="text-[18px] md:text-[22px] font-poppins text-black font-medium">{card}</p>
            </button>
        {/each}
    </div>
</div>
