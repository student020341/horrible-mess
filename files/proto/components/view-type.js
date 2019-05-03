_components.push((async () => ({
    newType: {
        path: "/project/:pid/type/:tid",
        template: await getTemplate("view-type.html"),
        props: true,
        data: () => ({
            projectTypes: [],
            loaded: false, 
            projectName: "", 
            name: "", 
            pid: 0,
            tid: 0,
            propGroups: []
        }),
        async created () {
            const pid = Number(this.$route.params.pid);
            this.pid = pid;
            if (!pid) { 
                this.loaded = true;
                return; 
            }

            // get project info
            let node = await dbh.getNode( pid );
            if (node) {
                this.projectName = node.__name;
            }

            // get node info
            const tid = Number(this.$route.params.tid);
            const tnode = await dbh.getNode( tid );
            if (tid && tnode) {
                this.tid = tid;
                this.name = tnode.name;
                this.propGroups = tnode.props;
            }

            // load project types
            this.projectTypes = await dbh.getLinksFrom(this.pid)
                .then(ids => dbh.mapNodes(ids))
                .then(mapped => mapped.filter(type => type.props.name != this.name && type.props.__type == "type"));

            this.loaded = true;
        },
        computed: {
            parentUrl () {
                return `/project/${this.pid}`;
            },
        },
        methods: {
            addNewGroup () {
                Vue.set(this, "propGroups", this.propGroups.concat({
                    name: "",
                    type: "Text", 
                    list: false,
                }));
            },
            removeGroup (index) {
                let updated = this.propGroups;
                updated.splice(index, 1);
                Vue.set(this, "propGroups", updated);
            },
            saveType () {
                var addOrUpdate;
                const data = {name: this.name, props: this.propGroups, __type: "type"};
                if (this.tid) {
                    addOrUpdate = dbh.idb.update("nodes", this.tid, data);
                } else {
                    addOrUpdate = dbh.addNode(this.pid, data);
                }
                
                return addOrUpdate.then(() => this.$router.push(this.parentUrl));
            },
            async selectNewType () {
                let haveName = !!this.name;
                if ((haveName && confirm("Save current data and go to new type?")) || !haveName) {
                    if (haveName) {
                        await this.saveType();
                    } else {
                        // no name means potentially going to the same route, so clear groups just in case
                        this.propGroups = [];
                    }
                    this.$router.push(`/project/${this.pid}/type/0`);
                }
            }
        }
    }
}))());
