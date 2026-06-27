<script lang="ts">
  import { onMount } from "svelte";
  // import { YIN } from "pitchfinder";
  import { PitchDetector } from "pitchy";
  
  import Configuracion from "./components/Configuracion.svelte";
  import Afinacion from "./components/Afinacion.svelte";
  import Nota from "./components/Nota.svelte";
  
  // Interface
  interface Note {
    numero: string;
    nombre: string;
    freq: number;
    boquillaOnly: boolean;
  }

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
  let meydaAnalyzer: any = null;
  let dataArray: Float32Array<ArrayBuffer>;
  let pitchDetector: PitchDetector<Float32Array> | null = null;


  // Limit variables
  const boquillaLimit = 0.025;
  const cornetaLimit = 0.01;
  const CORNET_MIN_HZ = 220;
  const CORNET_MAX_HZ = 1700; 
  const TOLERANCE_CENTS = 60;

  // Notes
  const CORNET_HARMONICS: Note[] = [
    { numero: "2*", nombre: "Si3", freq: 246.94, boquillaOnly: true },
    { numero: "2", nombre: "Do4", freq: 261.63, boquillaOnly: false },
    { numero: "3*", nombre: "Fa#4", freq: 369.99, boquillaOnly: true },
    { numero: "3", nombre: "Sol4", freq: 392.0, boquillaOnly: false },
    { numero: "4*", nombre: "Si4", freq: 493.88, boquillaOnly: true },
    { numero: "4", nombre: "Do5", freq: 523.25, boquillaOnly: false },
    { numero: "5*", nombre: "Re#5", freq: 622.25, boquillaOnly: true },
    { numero: "5", nombre: "Mi5", freq: 659.26, boquillaOnly: false },
    { numero: "6*", nombre: "Fa#5", freq: 739.99, boquillaOnly: true },
    { numero: "6", nombre: "Sol5", freq: 783.99, boquillaOnly: false },
    { numero: "7*", nombre: "La5", freq: 880.0, boquillaOnly: true },
    { numero: "7", nombre: "Sib5", freq: 932.33, boquillaOnly: false },
    { numero: "8*", nombre: "Si5", freq: 987.77, boquillaOnly: true },
    { numero: "8", nombre: "Do6", freq: 1046.5, boquillaOnly: false },
    { numero: "9*", nombre: "Mi6", freq: 1318.51, boquillaOnly: true },
    { numero: "9", nombre: "Fa6", freq: 1396.91, boquillaOnly: false },
    { numero: "10*", nombre: "Fa#6", freq: 1479.98, boquillaOnly: true },
    { numero: "10", nombre: "Sol6", freq: 1567.98, boquillaOnly: false },
  ];


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

      // YIN VERSION
      // detectPitch = YIN({
      //   sampleRate: audioContext.sampleRate,
      //   threshold: 0.15,
      // });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioSource = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      audioSource.connect(analyser);

      dataArray = new Float32Array(analyser.fftSize);

      pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
      pitchDetector.clarityThreshold = 0.9;
      pitchDetector.minVolumeDecibels = -35;

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
    if (!isListening || !analyser || !pitchDetector || !audioContext) return;

    analyser.getFloatFrequencyData(dataArray);

      const [pitch, clarity] = pitchDetector.findPitch(
      dataArray,
      audioContext.sampleRate
    );
 
    console.log("pitch:", pitch.toFixed(2), "clarity:", clarity.toFixed(3));
 
    // clarity 0 = silencio o ruido; ademas acotamos al rango real de la corneta
    if (clarity > 0 && pitch >= CORNET_MIN_HZ && pitch <= CORNET_MAX_HZ) {
      freqHz = Math.round(pitch * 100) / 100;
 
      const result = freqToCornetNote(freqHz, boquillaMode);
      if (result) {
        noteTxt = result.numero;
        desviation = result.cents;
      } else {
        // Esta dentro del rango pero no coincide con ninguna nota conocida
        noteTxt = "---";
        desviation = 0;
      }
    } else {
      // Sin señal clara o fuera de rango, reset
      freqHz = 0;
      noteTxt = "---";
      desviation = 0;
    }

    // SECOND VERSION
    // const result = detectCornetNoteByTemplate(analyser, audioContext!.sampleRate);

    // if (result && result.confidence > 40) {
    //   noteTxt = result.numero;
    //   freqHz = result.freq;
    //   console.log(freqHz);
    //   desviation = result.confidence;
    // } else {
    //   freqHz = 0;
    //   noteTxt = "---";
    //   desviation = 0;
    // }

    // FIRST VERSION
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

  function hzToCents(freq: number, reference: number): number {
    return 1200 * Math.log2(freq / reference);
  }

  function freqToCornetNote(
    freq: number,
    boquillaMode: boolean
  ): { numero: string; nombre: string; cents: number } | null {
    const candidates = CORNET_HARMONICS.filter(
      (note) => !note.boquillaOnly || !boquillaMode
    );
 
    let best: Note | null = null;
    let bestAbsCents = Infinity;
 
    for (const note of candidates) {
      const cents = Math.abs(hzToCents(freq, note.freq));
      if (cents < bestAbsCents) {
        bestAbsCents = cents;
        best = note;
      }
    }
 
    if (!best || bestAbsCents > TOLERANCE_CENTS) return null;
 
    const centsReal = hzToCents(freq, best.freq);
 
    return {
      numero: best.numero,
      nombre: best.nombre,
      cents: Math.round(centsReal),
    };
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

  // FIRST VERSION
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

</script>

<div class="w-full min-h-screen flex flex-col">
  <Configuracion {boquillaMode} {visible}/>

  <main class="flex-1 grid">
    <div class="flex flex-col items-center justify-center gap-8 px-8">
      <Nota {noteTxt} />
      <!-- <Afinacion bind:boquillaMode/> -->
      Freq: {freqHz}
      Confidence: {desviation}%
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
