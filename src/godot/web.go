package main

import (
	"net/http"

	"github.com/student020341/LearningGolang/src/lib/RouterModule"
)

var router RouterModule.SubRouter

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {
	router.Handle(w, r, path)
}

func GetName() string {
	return "godot"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/godot/index.html")
}

func init() {
	router.Register("/file/*", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
		http.ServeFile(w, r, "./files/godot/"+r.URL.Path[12:])
	})
	// fallback to serve home page, REGISTER LAST
	router.Register("*", "*", handleHome)
}

func main() {}
