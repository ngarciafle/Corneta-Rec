<script lang="ts">
    interface ConfiguracionState {
        boquillaMode: boolean;
    }

    let { boquillaMode = $bindable() }: ConfiguracionState = $props();

</script>

<div class="h-full w-full flex flex-col items-center justify-center pt-4">
    <div class="flex-col justify-center gap-2 pr-4">
        <button class={"rounded-full aspect-square w-5 md:w-8 lg:w-15 flex-col items-center justify-center cursor-pointer shadow-xl " + (boquillaMode ? ' shadow-green-300' : 'shadow-red-400')} onclick={() => boquillaMode = !boquillaMode}>
            <img src="/boquilla.png" alt="corneta" class="w-8 h-8 md:w-10 md:h-10 lg:w-15 lg:h-15 rounded-full" />
        </button>
        <p class={"text-sm text-gray-500 " + (boquillaMode ? 'text-green-600' : 'text-red-600')}>Modo boquilla</p>
    </div>

</div>