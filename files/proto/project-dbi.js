// idb functions for vue project

class ProjectDBI {
    constructor () {
        this.idb = new IDBH("projects", 1, ProjectDBI.schema());
    }

    // schema / upgrades
    static schema () {
        return [
            // link table of node associations
            db => new Promise(resolve => {
                let store = db.createObjectStore("links", { keypath: "id", autoIncrement: true });

                store.createIndex("parent", "parent", { unique: false });
                store.createIndex("child", "child", { unique: false });

                store.transaction.oncomplete = resolve;
            }),
            // node table of node properties
            db => new Promise(resolve => {
                let store = db.createObjectStore("nodes", { keypath: "id", autoIncrement: true });

                store.createIndex("__type", "__type", { unique: false });

                store.transaction.oncomplete = event => {
                    resolve();
                };
            })
        ];
    }

    // open db connection
    open () {
        return this.idb.open();
    }

    // todo: remove, replace with getLinksFrom
    // get children for a given parent id
    getChildren (id) {
        let store = this.idb.getStore("links", "readonly");
        let index = store.index("parent");

        // let projects = [];
        // return new Promise(resolve => {
        // 	index.openCursor().onsuccess = event => {
        // 		let cursor = event.target.result;
        // 		if (cursor) {
        // 			projects.push(cursor.value);
        // 			cursor.continue();
        // 		} else {
        // 			resolve(projects);
        // 		}
        // 	};
        // });

        return new Promise (resolve => {
            index.getAll(id).onsuccess = event => resolve(event.target.result);
        });
    }

    // map the results from linksTo and linksFrom
    mapNodes (ids) {
        return Promise.all(ids.map(async id => ({ __id: id, props: await this.getNode(id) })));
    }

    // ids of nodes that link to this node
    getLinksTo (id) {
        let store = this.idb.getStore("links", "readonly");
        let index = store.index("child");

        return new Promise (resolve => {
            index.getAllKeys(id).onsuccess = event => resolve(event.target.result);
        });
    }

    // ids of nodes that link from this node
    getLinksFrom (id) {
        let store = this.idb.getStore("links", "readonly");
        let index = store.index("parent");

        return new Promise (resolve => {
            index.getAllKeys(id).onsuccess = event => resolve(event.target.result);
        });
    }

    /*
        - delete any links that have this node as a child
        - delete any links that exist solely as a link or sub link from this node
        - delete any nodes with no other references
    */
    async deleteNode (id) {
        id = Number(id);

        // links to this node
        let parents = await this.getLinksTo(id);

        // links from this node
        let children = await this.getLinksFrom(id);

        // delete all references to or from this node
        let linksToDelete = [...parents, ...children];

        let deleteLinksPromise = this.idb.delete("links", linksToDelete);

        // delete the node itself
        let deleteNodesPromise = this.idb.delete("nodes", linksToDelete);

        return Promise.all([deleteLinksPromise, deleteNodesPromise]);
    }

    // get info from node table
    getNode (id) {
        let store = this.idb.getStore("nodes", "readonly");
        let request = store.get(id);
        return new Promise((resolve, reject) => {
            request.onerror = event => {
                reject(event.target.result);
            };
            request.onsuccess = event => {
                resolve(event.target.result);
            };
        });
    }

    async addNode (parent, data) {
        let records = await this.idb.add("nodes", Array.isArray(data) ? data : [data]);
        return this.idb.add("links", records.map(record => ({ parent: parent, child: record.id })));
    }

    // get all types searching on index __type, filter by project id as parent
    async getTypesForProject (project, type) {
        const typeIndex = this.idb.getIndex("nodes", "readonly", "__type");
        const types = await new Promise (resolve => {
            typeIndex.getAllKeys(type).onsuccess = event => resolve(event.target.result);
        });

        const children = await this.getLinksFrom(project);

        return types.filter(id => children.includes(id));
    }
}
