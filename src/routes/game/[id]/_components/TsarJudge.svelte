<script lang="ts">
    export let submissions: Array<{ id: string; answer: string }>= [];
    export let onPick: (id: string) => void = () => {};
    export let canPick: boolean = true;
    export let prompt: string = '';
    let selectedId: string | null = null;

    function pick(id: string) {
        if (!canPick) return;
        selectedId = id;
        onPick(id);
    }
</script>

<div class="w-full min-h-screen bg-[#090909] flex flex-col items-center justify-center gap-[28px] md:gap-[40px] p-[24px] md:p-[40px] relative overflow-hidden select-none">
    <img src="/illustrations/tsar_judge.png" alt="Lobby Monsters" class="absolute top-0 left-0 pointer-events-none" />

    <button class="h-[260px] md:h-[320px] w-[200px] md:w-[240px] bg-[#E1FF00] rounded-[28px] md:rounded-[32px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] ease-in-out flex items-start justify-start p-[20px] md:p-[28px] text-left">
        <p class="text-[18px] md:text-[22px] font-poppins text-black font-medium">{prompt}</p>
    </button>

    <div class="flex flex-row gap-[16px] md:gap-[20px] w-full max-w-[1200px] flex-wrap justify-center">
        {#each submissions as s}
            <button
                class="h-[260px] md:h-[320px] w-[200px] md:w-[240px] rounded-[28px] md:rounded-[32px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] {canPick ? 'bg-white cursor-pointer hover:scale-[1.05] hover:rotate-[-3deg] transition-all duration-300 active:scale-[0.95]' : 'bg-[#AAAAAA]'} ease-in-out flex items-start justify-start p-[20px] md:p-[28px] text-left"
                onclick={() => pick(s.id)}
            >
                <p class="text-[18px] md:text-[22px] font-poppins text-black font-medium">{s.answer}</p>
            </button>
        {/each}
    </div>
</div>
