_components.push((async () => ({
    interaction: {
        path: "/project/:pid/interaction/:iid",
        template: await getTemplate("interaction-view.html"),
        data: () => ({
            types: [], // types available to project
            pid: 0, // project id
            iid: 0, // interaction id
            projectName: "",
            name: "",
            loaded: false,
            inputs: [{list: false, type: 0, props: []}], // types involved in the interaction
            outputs: [{list: false, type: 0}], // types returned from the interaction
        }), 
        async created () {
            const pid = Number(this.$route.params.pid);
            this.pid = pid;
            if (!pid) { 
                this.loaded = true;
                return; 
            }

            // get project node to get the name
            let project = await dbh.getNode( pid );
            if (project) {
                this.projectName = project.__name;
            }

            // get types available to project
            this.types = await Promise.all( 
                await dbh.getTypesForProject(pid, "type")
                    .then(ids => ids.map(async id => ({ id: id, data: await dbh.getNode(id) })))
            );

            // fill in info for existing interaction
            const iid = Number(this.$route.params.iid);
            this.iid = iid;
            if (iid) {
                const inter = await dbh.getNode(iid);
                // clean inputs, remove invalid types
                inter.inputs = inter.inputs
                    .filter(ip => this.types.some(t => t.id == ip.type))
                    .map(ip => {
                        ip.props = ip.props.filter(p => typeof p.type == "string" || this.types.some(t => t.id == p.type));
                        return ip;
                    });
                // clean outputs
                inter.outputs = inter.outputs
                    .filter(op => typeof op.type == "string" || this.types.some(t => t.id == op.type));
                if (inter && inter.__type == "interaction") {
                    this.name = inter.name;
                    this.outputs = inter.outputs;
                    this.inputs = inter.inputs;
                }
            }

            this.loaded = true;
        },
        methods: {
            setInputProps (event, input) {
                const tid = Number(event.target.value);
                const type = this.types.find(type => type.id == tid);
                // deep copy since there can be multiple of any type
                input.props =  type.data.props.map(obj => Object.assign({}, obj));
            },
            addInput () {
                let updated = Object.assign([], this.inputs);
                updated.push({
                    list: false,
                    type: "",
                    props: []
                });
                Vue.set(this, "inputs", updated);
            },
            removeInput (index) {
                let updated = Object.assign([], this.inputs);
                updated.splice(index, 1);
                Vue.set(this, "inputs", updated);
            },
            addOutput () {
                let updated = Object.assign([], this.outputs);
                updated.push({
                    list: false,
                    type: ""
                });
                Vue.set(this, "outputs", updated);
            },
            removeOutput (index) {
                let updated = Object.assign([], this.outputs);
                updated.splice(index, 1);
                Vue.set(this, "outputs", updated);
            },
            saveInteraction () {
                const {name, outputs, inputs} = this;
                const interaction = {name, outputs, inputs, __type: "interaction"};
                var addOrUpdate;

                if (this.iid) {
                    addOrUpdate = dbh.idb.update("nodes", this.iid, interaction);
                } else {
                    addOrUpdate = dbh.addNode(this.pid, interaction);
                }
                
                addOrUpdate.then(() => this.$router.push(`/project/${this.pid}`));
            },
            // on the fly map for sub props
            propTypeLookup (type) {
                if (typeof type == "string") {
                    return type;
                } else if (typeof type == "number") {
                    return this.types.find(_type => _type.id == type).data.name;
                } else {
                    return "unknown";
                }
            }
        },
    }
}))());
