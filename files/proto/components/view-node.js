_components.push((async () => ({
    viewNode: {
        path: "/project/:id",
        template: await getTemplate("node-view.html"),
        props: true,
        data: () => ({ node: { __name: "" },
            propForm: {
                show: false,
                editing: false,
                type: "Text",
                list: false,
                name: ""
            },
            dragging: false,
            id: 0,
            types: [],
            interactions: [],
        }),
        async created () {
            const id = Number(this.$route.params.id);
            this.id = id;

            let node = await dbh.getNode( id );
            if (node) {
                this.node = node;
            }

            const children = await dbh.getLinksFrom(this.id).then(ids => dbh.mapNodes(ids));

            this.types = children.filter(node => node.props.__type == "type");
            this.interactions = children.filter(node => node.props.__type == "interaction");
        },
        methods: {
            // drag and drop
            dragStart (event, sort) {
                this.dragging = true;
                event.dataTransfer.setData("sort", sort);
            },
            dragEnd () {
                this.dragging = false;
            },
            drop (event, target) {
                let source = event.dataTransfer.getData("sort");
                if (target == source) { return; }
                let before = event.target.classList.contains("drop-left");
                let direction = Math.sign(source-target);

                // insert before/after target element
                let newSortId = before ? (direction == -1 ? target-1 : target) : (direction == 1 ? target+1 : target);
                // update array order
                let resorted = Object.assign([], this.props);
                resorted.splice(newSortId, 0, ...resorted.splice(source, 1));

                // update sort
                let updated = Object.assign({}, this.node);
                resorted.forEach(({key}, index) => updated[key].sort = index);

                // update db and set on vue
                dbh.idb.update("nodes", Number(this.$route.params.id), updated).then(() => Vue.set(this, "node", updated));
            },
            allowDrop (event) {
                event.preventDefault();
            },
            resetSortIds () {
                let updated = Object.assign({}, this.node);
                this.props.forEach(({key}, index) => updated[key].sort = index);
                dbh.idb.update("nodes", Number(this.$route.params.id), updated).then(() => Vue.set(this, "node", updated));
            },

            // prop MACD
            clearPropForm () {
                this.propForm = {
                    show: false,
                    editing: false,
                    type: "Text",
                    list: false,
                    name: ""
                };
            },
            typeIcon ({type}) {
                switch (type) {
                    case "Text": return "mdi mdi-format-color-text";
                    case "Number": return "mdi mdi-numeric";
                    case "Type": return "mdi mdi-code-braces";
                    default: return "mdi mdi-help";
                };
            },
            submitPropForm () {
                const {name, list, type, editing} = this.propForm;
                let updated = Object.assign({}, this.node, { [name]: { list, type } });

                // we should delete the previous key after successful edit
                const haveNewKey = editing && editing != name;
                // key is new and matches an existing key or
                // key is being edited and new name matches existing
                const willOverwrite = name in this.node && (!editing || editing != name);

                // new key name matches one that exists already
                if (willOverwrite && !confirm(`Property "${name}" exists. Overwrite?`)) {
                    return;
                } else if (!editing) {
                    // new entry = new sort order internal prop
                    let sort = Object.keys(this.props).length;
                    updated[name].sort = sort;
                } else {
                    // get sort order from previous node
                    // todo: copy all props dynamically if there are more
                    updated[name].sort = updated[editing].sort;
                }

                dbh.idb.update("nodes", Number(this.$route.params.id), updated).then(() => {
                    this.clearPropForm();
                    Vue.set(this, "node", updated);
                    // if the insert succeeded, we are editing a field, and the name has changed, delete the old entry
                    if (haveNewKey) {
                        this.deleteProp(editing, true);
                    }
                });
            },
            deleteProp (key, skip=false) {
                let ok = skip || confirm(`delete property "${key}"?`);
                if (ok) {
                    const updated = Object.assign({}, this.node);
                    delete updated[key];
                    dbh.idb.update("nodes", Number(this.$route.params.id), updated).then(() => {
                        Vue.set(this, "node", updated);
                        this.resetSortIds();
                    });
                }
            },
            // populate prop form with existing values & set editing to existing key name
            // submit form will delete the existing key and then put the new one
            editProp (key) {
                const {list, type} = this.node[key];
                const updated = {
                    list,
                    type,
                    name: key,
                    editing: key
                };
                Vue.set(this, "propForm", { show: true, ...updated });
            },
            deleteType (type) {
                if (confirm(`Delete type "${type.props.name}"?`)) {
                    dbh.deleteNode(type.__id).then(async () => {
                        const children = await dbh.getLinksFrom(this.id).then(ids => dbh.mapNodes(ids));
                        this.types = children.filter(node => node.props.__type == "type");
                    });
                }
            },
            deleteInteraction (interaction) {
                if (confirm(`Delete interaction "${interaction.props.name}"?`)) {
                    dbh.deleteNode(interaction.__id).then(async () => {
                        const children = await dbh.getLinksFrom(this.id).then(ids => dbh.mapNodes(ids));
                        this.interactions = children.filter(node => node.props.__type == "interaction");
                    });
                }
            },
            editType (type) {
                this.$router.push(`/type/${type.__id}`);
            }
        },
        computed: {
            props () {
                return Object.entries(this.node).reduce((arr, [key, value]) => {
                    if (!key.startsWith("__")) {
                        arr.push(Object.assign({}, {...value, key}));
                    }
                    return arr;
                }, []).sort((a,b) => a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0);
            }
        }
    }
}))());
