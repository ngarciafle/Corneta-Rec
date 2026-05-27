<script lang="ts">
    let { noteTxt = $bindable() }: { noteTxt: string } = $props();
</script>


<p class="text-4xl font-bold text-center">{noteTxt}</p>