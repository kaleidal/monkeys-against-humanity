<script lang="ts">
    export let checked = false;

    function toggle() {
        checked = !checked;
    }
</script>

<div class="flex flex-col items-center justify-center">
    <button aria-label="Toggle" class="relative w-[120px] h-[40px] mb-2 cursor-pointer select-none" on:click={toggle}>
        <div class="absolute left-0 top-1/2 w-full h-[28px] -translate-y-1/2 bg-[#3B3B3B]"></div>

        <div class="absolute top-1/2 h-[38px] w-[60px] bg-[#E1FF00] -translate-y-1/2 transition-all duration-150" style="{checked ? 'left: 0' : 'left: calc(100% - 60px)'}"></div>
    </button>
    <div class="w-[120px] flex justify-between px-2">
        <span class="text-[#B8B8B8] text-[32px] font-normal select-none" style="{checked ? 'color:#E1FF00' : ''}">yes</span>
        <span class="text-[#B8B8B8] text-[32px] font-normal select-none" style="{!checked ? 'color:#E1FF00' : ''}">no</span>
    </div>
</div>
