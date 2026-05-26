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

    // Audio variables (no reactive)
    let audioContext: AudioContext | null = null;
    let audioSource: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let detectPitch: any;
    let meydaAnalyzer: any = null;
    let dataArray: Float32Array;

    // Limit variables
    const boquillaLimit = 0.025;
    const cornetaLimit = 0.01; 

    onMount(() => {
        detectPitch = YIN({ sampleRate: 44100 });
        return () => stopAudio();

    })

    async function micConm() {
        if (isListening) {
            stopAudio();
            return;
        }

        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioSource = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            audioSource.connect(analyser);

            dataArray = new Float32Array(analyser.fftSize);

            meydaAnalyzer = Meyda.createMeydaAnalyzer({
                audioContext: audioContext,
                source: audioSource,
                bufferSize: 512,
                featureExtractors: ['rms']
            });

            isListening = true;
            loopProc();
        } catch (err) {
            console.error("Error al acceder al micrófono:", err);
            alert("No se pudo conectar el micrófono. Revisa los permisos.");
        }
    }

    function loopProc() {
        if (!isListening || !analyser || !meydaAnalyzer) return;

        const characteristics = meydaAnalyzer.get('rms');
        const limit = boquillaMode ? boquillaLimit : cornetaLimit;
        const pitch = detectPitch(dataArray);

        if (characteristics && characteristics.rms > limit) {
            // pitch limitation
            if (pitch && pitch > 60 && pitch < 600) {
                freqHz = Math.round(pitch * 100) / 100;
                
                const exactNote = 12 * (Math.log2(freqHz / 440)) + 69;
                const noteIndex = Math.round(exactNote) % 12;
                const noteNames = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
                noteTxt = noteNames[noteIndex];
                desviation = Math.round((exactNote - Math.round(exactNote)) * 100) / 100;
            }

            // I want to write the notes with band notation also **

        } else {
            // Sound below the limit, reset values
            freqHz = 0;
            noteTxt = '---';
            desviation = 0;
            return;
        }
    }

    function stopAudio() {
        isListening = false;
        if (meydaAnalyzer) meydaAnalyzer.stop();
        if (audioSource) audioSource.disconnect();
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        freqHz = 0;
        noteTxt = '---';
        desviation = 0;
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