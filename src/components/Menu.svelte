<script lang="ts">
    let { boquillaMode = $bindable(), visible = $bindable() }: { boquillaMode: boolean; visible: boolean } = $props();

</script>

<div>
    <button aria-label="Abrir configuración" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onclick={() => { visible = true; }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 5h-3m-4.25-2v4M13 5H3m4 7H3m7.75-2v4M21 12H11m10 7h-3m-4.25-2v4M13 19H3" />
        </svg>
    </button>
</div>

<div class={"absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-300 bg-opacity-10 z-40 " + (visible ? 'block' : 'hidden')}>
    <div class="bg-white rounded-lg p-8 w-96">
        <h2 class="text-xl font-bold mb-4">Configuración</h2>
        <div class="flex items-center gap-2 mb-4">
            <div>
                <label for="boquillaMode" class="text-gray-700">Modo boquilla:</label>
                <input type="checkbox" id="boquillaMode" bind:checked={boquillaMode} class="w-5 h-5 cursor-pointer" />
            </div>

        </div>
        <button aria-label="Cerrar" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-red-600" onclick={() => { visible = false; }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z" />
            </svg>
        </button>
    </div>


</div>