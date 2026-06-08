<script lang="ts">
  import { onMount } from "svelte";
  import { YIN } from "pitchfinder";

  import Configuracion from "./components/Configuracion.svelte";
  import Afinacion from "./components/Afinacion.svelte";
  import Nota from "./components/Nota.svelte";

  // Reactive variables
  let isListening: boolean = $state(false);
  let freqHz: number = $state(0);
  let noteTxt: string = $state("---");
  let desviation: number = $state(0);

  // Audio configuration variables
  let boquillaMode: boolean = $state(false);

  // Audio variables (no reactive)
  let audioContext: AudioContext | null = null;
  let audioSource: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let detectPitch: any;
  let meydaAnalyzer: any = null;
  let dataArray: Float32Array<ArrayBuffer>;

  // Limit variables
  const boquillaLimit = 0.025;
  const cornetaLimit = 0.01;

  onMount(() => {
    return () => stopAudio();
  });

  async function micConm() {
    if (isListening) {
      stopAudio();
      return;
    }

    try {
      audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      detectPitch = YIN({
        sampleRate: audioContext.sampleRate,
      });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioSource = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      audioSource.connect(analyser);

      dataArray = new Float32Array(analyser.fftSize);

      isListening = true;
      loopProc();
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert("No se pudo conectar el micrófono. Revisa los permisos.");
    }
  }

  function loopProc() {
    if (!isListening || !analyser) return;

    analyser.getFloatTimeDomainData(dataArray);

    const rms = getRMS(dataArray);
    const limit = boquillaMode ? boquillaLimit : cornetaLimit;
    const pitch = detectPitch(dataArray);

    console.log("rms:", rms, "limit:", limit, "pitch:", pitch);

    if (rms > limit) {
      if (pitch && pitch > 60 && pitch < 600) {
        freqHz = Math.round(pitch * 100) / 100;
        noteTxt = getBandName(freqHz);
        // const exactNote = 12 * Math.log2(freqHz / 440) + 69;
        // const noteIndex = Math.round(exactNote) % 12;
        // const noteNames = [
        //   "Do",
        //   "Do#",
        //   "Re",
        //   "Re#",
        //   "Mi",
        //   "Fa",
        //   "Fa#",
        //   "Sol",
        //   "Sol#",
        //   "La",
        //   "La#",
        //   "Si",
        // ];
        // noteTxt = noteNames[noteIndex];
        // desviation = Math.round((exactNote - Math.round(exactNote)) * 100) / 100;
      }
      // I want to write the notes with band notation also **
    } else {
      // Sound below the limit, reset values
      freqHz = 0;
      noteTxt = "---";
      desviation = 0;
    }

    // continue loop
    requestAnimationFrame(loopProc);
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
    noteTxt = "---";
    desviation = 0;
  }

  function getRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  function getBandName(freq: number): string {
    if (!freq || freq <= 0) return "---";

    // Registro Grave (Los Bajos)
    if (freq >= 88 && freq < 95 && !boquillaMode) return "2*"; // Fa# (Llave pulsada)
    if (freq >= 95 && freq < 110) return "2"; // Sol (Llave suelta)

    // Registro Medio (Segundas y transiciones)
    if (freq >= 118 && freq < 128 && !boquillaMode) return "3*"; // Sib (Llave pulsada)
    if (freq >= 128 && freq < 145) return "3"; // Do  (Llave suelta)
    if (freq >= 150 && freq < 161 && !boquillaMode) return "4*"; // Re  (Llave pulsada)
    if (freq >= 161 && freq < 178) return "4"; // Mi  (Llave suelta)

    // Registro Agudo (Primeras)
    if (freq >= 180 && freq < 192 && !boquillaMode) return "5*"; // Fa  (Llave pulsada)
    if (freq >= 192 && freq < 210) return "5"; // Sol (Llave suelta)

    if (freq >= 215 && freq < 226 && !boquillaMode) return "6*"; // La  (Llave pulsada)
    if (freq >= 226 && freq < 242) return "6"; // Sib (Llave suelta)

    // Registro Superagudo (El Pájaro y agudos modernos)
    if (freq >= 242 && freq < 255 && !boquillaMode) return "7*"; // Sib agudo con llave
    if (freq >= 255 && freq < 275) return "7"; // Do agudo ("Pájaro")

    if (freq >= 275) return "¡Agudo Extremo!";

    return "---";
  }
</script>

<div class="w-full min-h-screen flex flex-col">
  <Configuracion bind:boquillaMode />

  <main class="flex-1 grid grid-cols-2 divide-x divide-teal-800/40 p-8">
    <div class="flex flex-col items-center justify-center gap-8 px-8">
      <Afinacion />
      Freq: {freqHz}
    </div>

    <div class="flex flex-col items-center justify-center gap-8 px-8">
      <Nota {noteTxt} />

      {#if isListening}
        <button
          onclick={micConm}
          class="flex items-center gap-3 px-8 py-3 rounded-full border border-red-800 text-red-850 text-sm tracking-widest font-serif cursor-pointer hover:border-red-600 hover:bg-zinc-100 transition-colors"
        >
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Detener
        </button>
      {:else}
        <button
          onclick={micConm}
          class="flex items-center gap-3 px-8 py-3 rounded-full border border-zinc-200 text-sm tracking-widest font-serif cursor-pointer hover:border-teal-700 hover:bg-zinc-100 transition-colors"
        >
          <span class="w-2 h-2 rounded-full bg-teal-500"></span>
          Activar Micrófono
        </button>
      {/if}
    </div>
  </main>
</div>
