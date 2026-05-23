<script lang="ts">
    import { onMount } from "svelte";
    import { YIN } from "pitchfinder";

    import Configuracion from "./components/Configuracion.svelte";
    import Afinacion from "./components/Afinacion.svelte";
    import Nota from "./components/Nota.svelte";

    onMount(() => {
        
    })
</script>

<div class="w-full h-lvh md:grid grid-rows-[15%_85%]">
    <div class="flex items-center justify-center">
        <Configuracion />
    </div>

    <div class="grid grid-cols-2 gap-4">
        <Afinacion />
        <Nota />
    </div>
</div>