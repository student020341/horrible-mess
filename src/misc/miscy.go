package main

import (
	"net/http"
	"../lib/RouterModule"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName () string {
	return "misc"
}

var router RouterModule.SubRouter

func init(){
	// setup router
	router.Register("/file/*", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}){
		http.ServeFile(w, r, "./files/misc/" + r.URL.Path[11:]);
	})
}

func main() {
	
}
