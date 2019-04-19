/**
 * random notes
 * 
 * use cursor.advance(n) instead of cursor.continue() in order to skip / offset multiple rows
 * indexes are not required, data stored does not have to contain index keys, indexes just useful for faster lookups
 * + could use a "delete" index and mark some data with "delete" key to quick find and remove it
 */

// indexed database handler
class IDBH {
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
    constructor (name, ver=1, upgrades) {
        this.db_name = name; // db name
        this.db_ver = ver; // version
        this.upgrades = upgrades; // object with collection of upgrades and db version
        
        this.db = null;
    }

    deleteDB () {
        indexedDB.deleteDatabase(this.db_name);
    }

    // get / create db
    open () {

        let issue = this._invalid_upgrades();
        if (issue) {
            return Promise.reject(issue);
        }
        
        let req = indexedDB.open(this.db_name, this.db_ver);
        return new Promise((resolve, reject) => {
            req.onerror = event => {
                console.log("error opening db", event);
                reject();
            };

            // return existing db
            req.onsuccess = event => {
                this.db = event.target.result;
                resolve();
            };

            // create / upgrade db
            // onsuccess will be called when this is done, no need to resolve here
            req.onupgradeneeded = event => {
                let db = event.target.result;

                // map passed in upgrades to promises
                this.upgrades.forEach(upgrade => upgrade(db));
            };
        });
    }

    // meager upgrade validation
    _invalid_upgrades () {
        if (!this.upgrades || !Array.isArray(this.upgrades) || this.upgrades.length == 0) {
            return "no upgrades provided";
        }

        if (this.upgrades.some(u => typeof u != "function")) {
            return "upgrades must be functions";
        }

        return false;
    }

    // which 'table' to add to, array of objects
    // returns promise for all data inserted
    add (storeName, data) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction([storeName], "readwrite");
            let results = [];
            transaction.oncomplete = () => resolve(results);
            transaction.onerror = () => reject();

            let store = transaction.objectStore(storeName);
            data.forEach(obj => {
                // return mapping of { id: inserted data }
                store.add(obj).onsuccess = (event) => results.push({id: event.target.result, data: obj});
            });
        });
    }

    // fast delete for collection of ids and a storename
    delete (storeName, ids) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction([storeName], "readwrite");
            transaction.oncomplete = resolve;
            transaction.onerror = reject;

            let store = transaction.objectStore(storeName);
            ids.forEach(id => store.delete(id));
        });
    }

    // fast update for id and data to overwrite
    update (storeName, id, data) {
        return new Promise((resolve, reject) => {
            let store = this.getStore(storeName, "readwrite");
            let update = store.put(data, id);
            update.onerror = reject;
            update.onsuccess = resolve;
        });
    }

    // get a db->transaction with given mode
    // use transaction.objectStore(name) to get specific store from result
    getTransaction (storeNames, mode) {
        return this.db.transaction(storeNames, mode);
    }

    // convenience for getting a single store (table)
    getStore (name, mode) {
        return this.getTransaction([name], mode).objectStore(name);
    }

    testGet () {
        let transaction = this.db.transaction(["associations"]);
        let store = transaction.objectStore("associations");

        // gets 1 by id / key
        // let request = store.get("1-2");
        // request.onerror = event => {
        //     console.log("error", event.target.result);
        // };
        // request.onsuccess = event => {
        //     console.log("success", event.target.result);
        // };

        // gets first entry it finds
        // let index = store.index("parent");
        // index.get(1).onsuccess = event => {
        //     console.log("parent index", event);
        // };

        // use cursor to get multiple for specific index and value
        // let index = store.index("parent");
        // index.openCursor().onsuccess = event => {
        //     console.log("blap!");
        //     let cursor = event.target.result;
        //     if (cursor) {
        //         console.log("cursor:", cursor.value);
        //         cursor.continue();
        //     } else {
        //         console.log("done");
        //     }
        // };

        // get everything
        // store.openCursor().onsuccess = event => {
        //     let cursor = event.target.result;
        //     if (cursor) {

        //         console.log("item", cursor);
        //         cursor.continue();
        //     }
        // };
        
    }

    testUpdate () {
        let store = this.db.transaction(["associations"], "readwrite").objectStore("associations");
        let request = store.get("1-2");

        request.onerror = event => {
            console.log("fail", event);
        };

        request.onsuccess = event => {
            let data = event.target.result;
            console.log("data", data);
            data.child = 62;

            // this probably won't make sense for this db, need to delete old record otherwise the key will be wrong
            let update = store.put(data, `1-2`);
            update.onerror = event => {
                console.log("update fail", event);
            };

            update.onsuccess = event => {
                console.log("updated", event);
            };
        };
    }

    testDelete () {
        // delete key of specific entry
        // let request = this.db.transaction(["associations"], "readwrite")
        //     .objectStore("associations")
        //     .delete("1-2");

        let tx = this.db.transaction(["associations"], "readwrite");
        let store = tx.objectStore("associations");
        let index = store.index("child");
        // get keys of specific index value
        index.openKeyCursor(IDBKeyRange.only(3)).onsuccess = event => {
            let cursor = event.target.result;
            if (cursor) {
                console.log("child", cursor);
                // to delete...
                // store.delete(cursor.primaryKey)
                cursor.continue();
            }
        };
    }
}

// let test = new IDBH("testing");
// test.open()
//     .then(() => console.log("db open"));