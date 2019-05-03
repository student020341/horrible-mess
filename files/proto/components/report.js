_components.push((async () => ({
    report: {
        path: "/project/:id/report",
        template: await getTemplate("report.html"),
        data: () => ({ id: 0, projectName: "", types: [], interactions: [] }), 
        async created () {
            this.id = Number(this.$route.params.id);
            dbh.getNode(this.id).then(node => this.projectName = node.__name);

            // all children
            const children = await dbh.getLinksFrom(this.id)
                .then(ids => dbh.mapNodes(ids));

            // mapped types
            this.types = children.filter(({props}) => props.__type == "type");

            // mapped interactions
            this.interactions = children.filter(({props}) => props.__type == "interaction");
        },
        methods: {
            getTypeName (type) {
                if (typeof type == "string") {
                    return type;
                } else if (typeof type == "number") {
                    return this.types.find(_type => _type.__id == type).props.name;
                } else {
                    return "unknown";
                }
            },
            getIncluded (props) {
                const includeAll = !props.some(prop => prop.include);
                if (!includeAll) {
                    props = props.filter(prop => prop.include);
                }
                return props.map(prop => prop.name).join(", ");
            }
        }
    }
}))());
