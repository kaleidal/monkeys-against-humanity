<script lang="ts">
    export let min = 1;
    export let max = 8;
    export let step = 1;
    export let value = min;

    $: values = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);
    $: range = max - min;
    $: percent = range > 0 ? (value - min) / range : 0;

    let sliderEl: HTMLDivElement;
    let dragging = false;

    function setValueFromEvent(e: PointerEvent | MouseEvent | TouchEvent) {
        const rect = sliderEl.getBoundingClientRect();
        const clientX =
            'touches' in e && e.touches.length ? e.touches[0].clientX : (e as PointerEvent | MouseEvent).clientX;

        const x = clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        const raw = min + pct * range;
        const snapped = Math.round((raw - min) / step) * step + min;
        value = Math.max(min, Math.min(max, snapped));
    }

    function handleClick(e: MouseEvent) {
        setValueFromEvent(e);
    }

    function handlePointerDown(e: PointerEvent) {
        dragging = true;
        setValueFromEvent(e);
    }
    function handleTouchStart(e: TouchEvent) {
        dragging = true;
        e.preventDefault();
        setValueFromEvent(e);
    }
    function handlePointerMove(e: PointerEvent) {
        if (dragging) setValueFromEvent(e);
    }
    function handleTouchMove(e: TouchEvent) {
        if (!dragging) return;
        e.preventDefault();
        setValueFromEvent(e);
    }
    function handlePointerUp() {
        dragging = false;
    }
    function handleTouchEnd() {
        dragging = false;
    }

    $: {
        if (dragging) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        } else {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        }
    }

    function getLabelLeft(val: number) {
        const p = range > 0 ? (val - min) / range : 0;
        return `${p * 100}%`;
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            value = Math.max(min, Math.min(max, value - step));
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            value = Math.max(min, Math.min(max, value + step));
        } else if (e.key === 'Home') {
            e.preventDefault();
            value = min;
        } else if (e.key === 'End') {
            e.preventDefault();
            value = max;
        }
    }
</script>

<div class="relative w-full pb-8 select-none" bind:this={sliderEl}>
    <div
        class="relative h-10 w-full cursor-pointer touch-none"
        role="slider"
        tabindex="0"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        on:click={handleClick}
        on:keydown={handleKeyDown}
        on:pointerdown={handlePointerDown}
        on:touchstart={handleTouchStart}
    >
        <div class="absolute top-1/2 left-0 w-full h-2 bg-[#3B3B3B] -translate-y-1/2"></div>
        <div
            class="absolute top-1/2 left-0 h-2 bg-[#E1FF00] -translate-y-1/2 {dragging ? '' : 'transition-all duration-100'}"
            style="width: {percent * 100}%;"
        ></div>
        <div
            class="absolute top-1/2 h-[30px] w-[30px] bg-[#E1FF00] -translate-y-1/2 -translate-x-1/2 cursor-pointer {dragging ? '' : 'transition-all duration-100'} touch-none"
            style="left: {percent * 100}%;"
        ></div>
    </div>
    <div class="absolute w-full left-0 top-[44px] h-6">
        {#each values as val}
            <span
                style="left: {getLabelLeft(val)}; transform: translateX(-50%);"
                class="absolute text-[#A2A2A2] text-[18px] font-normal select-none"
            >{val}</span>
        {/each}
    </div>
</div>
