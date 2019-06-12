const springServer = `http://${window.location.hostname}:2002`;
const incrementScore = (name) => fetch(springServer + `/score/${name}`);
const getPlayerData = (name) => fetch(springServer + `/status/${name}`);
const registerPlayer = (name) => fetch(springServer + `/register/${name}`);
let playerObj;

function setStatusText (status) {
    gameInstance.SendMessage("Network", "setStatusText", status);
}

function setScoreText (score) {
    gameInstance.SendMessage("Network", "setScore", Number(score));
}

async function webInit () {
    setStatusText("connecting...");

    // get player
    let search = new URLSearchParams(window.location.search);
    let name = search.get("name") || "test";
    let raw = await getPlayerData(name).then(response => response.text());

    // create player if they don't exist
    if (!raw) {
        await registerPlayer(name);
        raw = getPlayerData(name).then(response => response.text());
    }

    playerObj = JSON.parse(raw);
    setStatusText(`Connected as ${playerObj.name}`);
    setScoreText(playerObj.score);
}

async function addPoint () {
    await incrementScore(playerObj.name);
    playerObj = await getPlayerData(playerObj.name).then(response => response.json());
    setScoreText(playerObj.score);
}
