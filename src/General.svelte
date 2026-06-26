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
  let visible: boolean = $state(false);

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

  // Notes
  const CORNET_HARMONICS: Note[] = [
    { numero: "2*", nombre: "Si3",   freq: 246.94, boquillaOnly: true  },
    { numero: "2",  nombre: "Do4",   freq: 261.63, boquillaOnly: false },

    { numero: "3*", nombre: "Fa#4",  freq: 369.99, boquillaOnly: true  },
    { numero: "3",  nombre: "Sol4",  freq: 392.00, boquillaOnly: false },

    { numero: "4*", nombre: "Si4",   freq: 493.88, boquillaOnly: true  },
    { numero: "4",  nombre: "Do5",   freq: 523.25, boquillaOnly: false },

    { numero: "5*", nombre: "Re#5",  freq: 622.25, boquillaOnly: true  },
    { numero: "5",  nombre: "Mi5",   freq: 659.26, boquillaOnly: false },

    { numero: "6*", nombre: "Fa#5",  freq: 739.99, boquillaOnly: true  },
    { numero: "6",  nombre: "Sol5",  freq: 783.99, boquillaOnly: false },

    { numero: "7*", nombre: "La5",   freq: 880.00, boquillaOnly: true  },
    { numero: "7",  nombre: "Sib5",  freq: 932.33, boquillaOnly: false },

    { numero: "8*", nombre: "Si5",   freq: 987.77, boquillaOnly: true  },
    { numero: "8",  nombre: "Do6",   freq: 1046.50, boquillaOnly: false },
  ];

  // Interface
  interface Note {
    numero: string;
    nombre: string;
    freq: number;
    boquillaOnly: boolean;
  }


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
        threshold: 0.15,
      });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioSource = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 8192;
      audioSource.connect(analyser);

      dataArray = new Float32Array(analyser.fftSize);

      isListening = true;
      loopProc();
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert("No se pudo conectar el micrófono. Revisa los permisos.");
    }
  }

  function getActiveHarmonics(boquillaMode: boolean): Note[] {
    return CORNET_HARMONICS.filter(note => !note.boquillaOnly || !boquillaMode);
  }

  function loopProc() {
    if (!isListening || !analyser) return;

    const result = detectCornetNoteByTemplate(analyser, audioContext!.sampleRate);

    if (result && result.confidence > 40) {
      noteTxt = result.numero;
    } else {
      freqHz = 0;
      noteTxt = "---";
      desviation = 0;
    }

    // const rms = getRMS(dataArray);
    // const limit = boquillaMode ? boquillaLimit : cornetaLimit;
    // let pitch = detectPitch(dataArray);

    // console.log("rms:", rms, "limit:", limit, "pitch:", pitch);

    // if (rms > limit && pitch) {

    //   // Correcting pitch if it gets armonically confused with the first harmonic (octave)
    //   if (pitch > 380 && pitch < 540) {
    //     pitch = pitch / 3;

    //     if (pitch < 120 || pitch > 150) {
    //       pitch = pitch * 3 / 2;
    //     }
    //   }
    //   if (pitch && pitch > 60 && pitch < 600) {
    //     freqHz = Math.round(pitch * 100) / 100;
    //     noteTxt = getBandName(freqHz);
    //     // const exactNote = 12 * Math.log2(freqHz / 440) + 69;
    //     // const noteIndex = Math.round(exactNote) % 12;
    //     // const noteNames = [
    //     //   "Do",
    //     //   "Do#",
    //     //   "Re",
    //     //   "Re#",
    //     //   "Mi",
    //     //   "Fa",
    //     //   "Fa#",
    //     //   "Sol",
    //     //   "Sol#",
    //     //   "La",
    //     //   "La#",
    //     //   "Si",
    //     // ];
    //     // noteTxt = noteNames[noteIndex];
    //     // desviation = Math.round((exactNote - Math.round(exactNote)) * 100) / 100;
    //   }
    //   // I want to write the notes with band notation also **
    // } else {
    //   // Sound below the limit, reset values
    //   freqHz = 0;
    //   noteTxt = "---";
    //   desviation = 0;
    // }

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

  // function getRMS(buffer: Float32Array): number {
  //   let sum = 0;
  //   for (let i = 0; i < buffer.length; i++) {
  //     sum += buffer[i] * buffer[i];
  //   }
  //   return Math.sqrt(sum / buffer.length);
  // }

  // Freq spectrum analysis to detect the note based on harmonics
  function detectCornetNoteByTemplate(analyser: AnalyserNode, sampleRate: number) : { numero: string, nombre: string, freq: number, confidence: number } | null {
    const N = analyser.fftSize;
    const freqData = new Float32Array(N / 2);
    analyser.getFloatFrequencyData(freqData);

    const maxDb = Math.max(...freqData);
    if (maxDb < -50) return null;

    const spectrum = freqData.map(db => Math.pow(10, db / 20));
    const binHz = sampleRate / N;

    const candidates = getActiveHarmonics(boquillaMode);

    let bestNote: Note | null = null;
    let bestScore = 0;
    let totalScore = 0;

    for (const note of candidates) {
      const score = scoreNote(spectrum, binHz, note.freq);
      totalScore += score;
      if (score > bestScore) {
        bestScore = score;
        bestNote = note;
      }
    }

    if (!bestNote || bestScore <= 0) return null;

    const confidence = totalScore > 0 ? bestScore / totalScore : 0;

    return {
      numero: bestNote.numero,
      nombre: bestNote.nombre,
      freq: bestNote.freq,
      confidence: Math.round(confidence * 100),
    };
  }

  function scoreNote(spectrum: Float32Array, binHz: number, baseFreq: number): number {
  let score = 0;
  for (let h = 1; h <= 6; h++) {
    const freq = baseFreq * h;
    const bin = Math.round(freq / binHz);
    if (bin < spectrum.length) {
      let peak = 0;
      for (let b = bin - 2; b <= bin + 2; b++) {
        if (b >= 0 && b < spectrum.length) peak = Math.max(peak, spectrum[b]);
      }
      score += peak / h;
    }
  }
  return score;
}

  // WRONG CALCSS :/
  // function getBandName(freq: number): string {
  //   if (!freq || freq <= 0) return "---";

  //   // Registro Grave (Los Bajos)
  //   if (freq >= 88 && freq < 95 && !boquillaMode) return "2*"; // Fa# (Llave pulsada)
  //   if (freq >= 95 && freq < 110) return "2"; // Sol (Llave suelta)

  //   // Registro Medio (Segundas y transiciones)
  //   if (freq >= 118 && freq < 128 && !boquillaMode) return "3*"; // Sib (Llave pulsada)
  //   if (freq >= 128 && freq < 145) return "3"; // Do  (Llave suelta)
  //   if (freq >= 150 && freq < 161 && !boquillaMode) return "4*"; // Re  (Llave pulsada)
  //   if (freq >= 161 && freq < 178) return "4"; // Mi  (Llave suelta)

  //   // Registro Agudo (Primeras)
  //   if (freq >= 180 && freq < 192 && !boquillaMode) return "5*"; // Fa  (Llave pulsada)
  //   if (freq >= 192 && freq < 210) return "5"; // Sol (Llave suelta)

  //   if (freq >= 215 && freq < 226 && !boquillaMode) return "6*"; // La  (Llave pulsada)
  //   if (freq >= 226 && freq < 242) return "6"; // Sib (Llave suelta)

  //   // Registro Superagudo (El Pájaro y agudos modernos)
  //   if (freq >= 242 && freq < 255 && !boquillaMode) return "7*"; // Sib agudo con llave
  //   if (freq >= 255 && freq < 275) return "7"; // Do agudo ("Pájaro")

  //   if (freq >= 275) return "¡Agudo Extremo!";

  //   return "---";
  // }
</script>

<div class="w-full min-h-screen flex flex-col">
  <Configuracion {boquillaMode} {visible}/>

  <main class="flex-1 grid">
    <div class="flex flex-col items-center justify-center gap-8 px-8">
      <Nota {noteTxt} />
      <!-- <Afinacion bind:boquillaMode/> -->
      Freq: {freqHz}
    </div>

    <div class="flex flex-col items-center justify-center gap-8 px-8">

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
