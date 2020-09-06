<script>

    export let limb;

</script>

<div>
    <div class="box" style="background-color: {limb.color}"></div>
    <p>{limb.slot}</p>
</div>

<style type="text/scss">

    .box {
        outline: 1px solid black;
        width: 64px;
        height: 64px;
    }

</style>