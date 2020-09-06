// main game loop
async function loop () {
    while(true) {
        let t2 = performance.now();
        let p = new Promise(resolve => requestAnimationFrame(t1 => {
            // time delta
            let dt = (t1 - t2)/1000;
            // do not interpolate latency greater than 1 second
            if (dt > 1 || !game.running) {
                resolve();
                return;
            }
            
            // draw, debug, etc

            resolve();
        }));

        await p;
    }
}