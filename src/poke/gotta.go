package main

import (
	"fmt"
	"net/http"
	"../lib/RouterModule"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName () string {
	return "poke"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/poke/index.html")
}

var router RouterModule.SubRouter

func init(){
	// setup router
	router.Register("/", "GET", handleHome)
	router.Register("/test", "GET", func(args map[string]interface{})interface{}{
		query := args["query"]
		fmt.Println(query)

		return 1
	})
	router.Register("/file/:name", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}){
		route := args["route"].(map[string]string)
		http.ServeFile(w, r, "./files/poke/" + route["name"]);
	});
	router.Register("/glob/*", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}){
		fmt.Fprint(w, r.URL.Path[11:])
	})
}

func main() {
	fmt.Println("ayy")
}
