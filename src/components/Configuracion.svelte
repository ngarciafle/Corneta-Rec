<script lang="ts">
  import Menu from "./Menu.svelte";

    let { boquillaMode = $bindable(), visible = $bindable() }: { boquillaMode: boolean; visible: boolean } = $props();
</script>

<header class="w-full min-h-5 px-4 pt-3">
    <div class="flex justify-between align-center ml-3">
        <Menu {boquillaMode} {visible} />
        <a href="https://github.com/ngarciafle/Corneta-Rec" target="_blank" rel="noopener noreferrer" class="hover:text-blue-500">Github</a>
        <!-- <h1 class="text-2xl font-bold p-5">Corneta Finder</h1> -->

        <!-- <div class="flex-col justify-center gap-2 pr-4">
            <button class={"rounded-full aspect-square w-5 md:w-8 lg:w-15 flex-col items-center justify-center cursor-pointer shadow-xl " + (boquillaMode ? ' shadow-green-300' : 'shadow-red-400')} onclick={() => boquillaMode = !boquillaMode}>
                <img src="/boquilla.png" alt="corneta" class="w-8 h-8 md:w-10 md:h-10 lg:w-15 lg:h-15 rounded-full" />
            </button>
            <p class={"text-sm text-gray-500 " + (boquillaMode ? 'text-green-600' : 'text-red-600')}>Modo boquilla</p>
        </div> -->

    </div>
</header>