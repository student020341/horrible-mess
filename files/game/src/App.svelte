<script>
	import PaperDoll from "./stuff/PaperDoll.svelte";

	const examplePlayerData = {
		name: "player1",
		limbs: [
			{
				slot: "left-hand",
				color: "#FF0000"
			},
			{
				slot: "right-hand",
				color: "#0000FF"
			},
			{
				slot: "head",
				color: "#00FF00"
			}
		]
	};

</script>

<main>
	<PaperDoll playerData={examplePlayerData} />
</main>