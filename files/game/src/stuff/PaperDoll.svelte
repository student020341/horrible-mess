<script>

    import { onMount } from "svelte";
    import Slot from "./Slot.svelte";

    export let playerData;

    onMount(() => {
        console.log("player data\n", playerData);
    });
</script>

<div>
    <p>Player: {playerData.name}</p>
    <p>Slots</p>
    {#each playerData.limbs as limb}
        <Slot {limb} />
    {/each}
</div>

<style type="text/scss">

</style>