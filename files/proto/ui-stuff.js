/*
stuff
    phases
        phase 1: messy chaotic guess implementation & some mock data for how this structure should be stored
        phase 2: refined approach to recreate the haphazard but funcitonal phase 1
        phase 3: full functionality 
        phase 4: client side db (maybe refactor data structure similar to node project?) & download
    views
        load project
            list available projects
        depth / path / breadcrumb
            shows current location and allows user to jump back
            maybe this should be done as a tree instead?
        body / edit / tiles
            infinitely nestable boxes
            click a tile
                reload body with contents of that tile
                update tree / breadcrumb
    architecture
        app root contains pages
        page contains views
        view contains a dom node it can modify and bind actions on
        + view can trigger actions within the page or transition to another page
*/

// mock data
let sampleData = {
    example1: {
        test: "number",
        user: {
            name: "text",
            something: "test"
        },
        authToken: {
            user: "user",
            id: "number"
        }
    }
};

class AppThing {
    constructor(element) {
        this.container = element;

        this.path = [];
    }

    // get keys for current path
    currentKeys () {
        let arr = Array.from(this.path);
        let r = sampleData[arr.shift()] || {};
        for (let i = 0;i < arr.length;i++) {
            r = r[arr.shift()];
            if (!(typeof r == "object" && r)) {
                r = {};
                break;
            }
        }

        return Object.keys(r);
    }

    // clear all child nodes of container
    removeChildren () {
        Array.from(this.container.children).forEach(el => el.remove());
    }

    // show list of projects and option to create new one
    renderInitialPage () {
        // retrieve any existing projects
        this.path = [];
        let projects = Object.keys(sampleData);
        let content = `<h2>Projects</h2>
            <ul class="ul-links">
                <li>Create New</li>
                ${projects.reduce((html, project) => `${html}<li>${project}</li>`, "")}
            </ul>`;

        this.container.innerHTML = content;

        // grab & bind
        Array.from(document.querySelectorAll("ul.ul-links > li")).forEach(el => {
            el.addEventListener("click", () => {
                this.path.push(el.innerText);
                this.renderEditMain();
                });
        });
    }

    // main project workspace
    renderEditMain () {
        this.removeChildren();
        let current = this.path[ this.path.length -1 ];

        // mechanism for view refresh
        const update = (obj, ...args) => obj.node.innerHTML = obj.content(args);

        // views and providers
        const views = {
            // editable title
            header: {
                node: document.createElement("div"),
                content: name => `<h2><span class="cursor-pointer" id="home">[home]</span> Editing project: <input type="text" value="${name}" /></h2>`,
                bind: () => {
                    const pname = views.header.node.querySelector("input");
                    pname.addEventListener("input", () => {
                        this.path[0] = pname.value;
                        update(views.path);
                    });

                    const home = views.header.node.querySelector("#home");
                    home.addEventListener("click", () => {
                        this.renderInitialPage();
                    });
                }
            },
            // current path in project
            path: {
                node: document.createElement("div"),
                content: () => `<p>Viewing: ${this.path.map(n => `<span class="breadcrumb cursor-pointer">${n}</span>`).join(" > ")}</p>`,
                bind: () => {
                    Array.from(views.path.node.querySelectorAll(".breadcrumb")).forEach(node => {
                        node.addEventListener("click", () => {
                            console.log("go to", node.innerText);
                        });
                    });
                }
            },
            // blobs / tiles of information
            body: {
                node: document.createElement("div"),
                content: blobs => {
                    let [tiles] = blobs;
                    return `<ul class="tiles">
                        <li>add new</li>${tiles.reduce((html, tile) => `${html}<li>${tile}</li>`, "")}
                    </ul>`;
                },
                bind: () => {
                    Array.from(views.body.node.querySelectorAll("ul.tiles > li")).forEach(el => {
                        el.addEventListener("click", () => {
                            // add item to path
                            this.path.push(el.innerText);
                            // update breadcrumb
                            // update(views.path);
                            // views.path.bind();
                            // update main view
                            this.renderEditMain();
                        });
                    });
                }
            }
        };

        // attach view nodes to container
        ["header", "path", "body"].forEach(view => this.container.append(views[view].node));

        // initial load
        update(views.header, current);
        update(views.path);
        update(views.body, this.currentKeys() || {});
        
        // bindings
        Object.values(views).forEach(view => typeof view.bind == "function" && view.bind() );

        // todo: render types in project
    }
}

// let app = new AppThing(document.getElementById("container"));
// app.renderInitialPage();
