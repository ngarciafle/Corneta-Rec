<script lang="ts">
    interface ConfiguracionState {
        cornetaType: string;
        boquillaMode: boolean;
    }

    let { boquillaMode = $bindable() , cornetaType = $bindable() }: ConfiguracionState = $props();
</script>

<header class="w-full">
    <div class="flex align-center pl-4">
        <h1 class="text-2xl font-bold">Corneta Finder</h1>

        <div>
            <img src="/" alt="corneta" class="w-6 h-6 ml-4 rounded-full" />
            <p class="text-sm text-gray-500">Afinación</p>
        </div>

        <div>
            <img src="/boquilla.png" alt="corneta" class="w-6 h-6 ml-4 rounded-full" />
            <p class="text-sm text-gray-500">Modo boquilla</p>
        </div>
    </div>
    <div class="w-full h-[0.5px] bg-gray-300"></div>
</header>