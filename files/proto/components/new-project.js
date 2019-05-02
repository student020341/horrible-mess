_components.push((async () => ({
    newProject: {
        path: "/new-project",
        template: await getTemplate("new-project.html"),
        data: () => ({ name: "" }),
        computed: {
            validName: function () {
                return !!this.name;
            }
        },
        methods: {
            goToHome: () => app.$router.push("/"),
            submit: function () { // needed for "this"
                dbh.addNode(0, {__name: this.name, __type: "project"})
                    .then(() => this.$router.push("/"));
            }
        },
    }
}))());
