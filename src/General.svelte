<script lang="ts">
    import { onMount } from "svelte";
    import { YIN } from "pitchfinder";
    import Meyda from "meyda";

    import Configuracion from "./components/Configuracion.svelte";
    import Afinacion from "./components/Afinacion.svelte";
    import Nota from "./components/Nota.svelte";

    // Reactive variables
    let isListening: boolean = $state(false);
    let freqHz: number = $state(0);
    let noteTxt: string = $state('---');
    let desviation: number = $state(0);

    // Audio configuration variables
    let boquillaMode: boolean = $state(false);

    // Internal variables
    let detectPitch: any;

    onMount(() => {
        detectPitch = YIN({ sampleRate: 44100 });

        return () => {
            stopAudio();
        }
    })

    function stopAudio() {

    }
</script>

<div class="w-full h-lvh md:grid grid-rows-[15%_85%]">
    <div class="flex items-center justify-center">
        <Configuracion boquillaMode={boquillaMode} />
    </div>

    <div class="grid grid-cols-[49%_2%_49%] gap-4">
        <Afinacion />
        <div class="h-full w-[.5px] -[0.5px] bg-[#76ABAE]"></div>
        <Nota />
    </div>
</div>