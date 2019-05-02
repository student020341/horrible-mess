_components.push((async () => ({
    home: {
        path: "/",
        template: await getTemplate("project-list.html"),
        data: () => ({ projects: [] }), 
        async created () {
            let projectIds = await dbh.getLinksFrom(0);
            this.projects = await this.getMappedProjects(projectIds);
        },
        methods: {
            async getMappedProjects (ids) {
                return Promise.all(ids.map(async id => ({ id: id, props: await dbh.getNode(id) })));
            },
            remove (id) {
                let project = this.projects.find(project => project.id == id);
                if (confirm(`Delete project "${project.props.__name}"?`)) {
                    dbh.deleteNode(id).then(async () => {
                        this.projects = await this.getMappedProjects( await dbh.getLinksFrom(0) );
                    });
                }
            }
        }
    }
}))());
