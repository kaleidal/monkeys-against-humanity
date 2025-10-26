<script lang="ts">
  import * as ui from './ui';
  import bwomp from './assets/bwomp.mp3';

  const clickSound = new Audio(bwomp);
  function playClick() {
    clickSound.currentTime = 0;
    clickSound.play();
  }

  let code = '';
  let nickname = '';

  function join() {
    playClick();
    // TODO: hook up to backend later
    if (!code.trim()) {
      alert('Enter a lobby code');
      return;
    }
    alert(`Joining ${code.toUpperCase()} as ${nickname || 'anonymous'}`);
  }

  function goHome() {
    playClick();
    location.hash = '#/';
  }
</script>

<div class="min-h-screen bg-[#090909] text-white">
  <div class="max-w-3xl mx-auto px-6 pt-10 pb-20">
    <div class="flex items-center justify-between mb-10">
      <button class={ui.btnGhostClass} onclick={goHome}>
        <span class="flex items-center gap-3">
          <span aria-hidden="true">←</span>
          <span>back</span>
        </span>
      </button>
      <img src="/logo.svg" alt="Logo" class="h-10 opacity-90" />
    </div>

    <h1 class="font-protest text-5xl md:text-6xl tracking-tight mb-8">join game</h1>
    <p class="text-white/70 mb-10 max-w-prose">Got a code? Kick the door in. Grab your cards, bring your attitude, and try not to get canceled.</p>

    <div class="space-y-6">
      <label class="block">
        <span class="text-white/80 mb-2 font-poppins block">lobby code</span>
        <input class={ui.inputClass} placeholder="e.g. 9XKLMN" bind:value={code} />
      </label>

      <label class="block">
        <span class="text-white/80 mb-2 font-poppins block">nickname</span>
        <input class={ui.inputClass} placeholder="e.g. chaotic neutral" bind:value={nickname} />
      </label>

      <div class="pt-4">
        <button class={ui.btnClass} onclick={join}>
          <span class="flex items-center gap-4">
            <span>enter lobby</span>
            <span aria-hidden="true" class="transition-transform duration-200 ease-out translate-x-0 group-hover:translate-x-1">➜</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</div>
