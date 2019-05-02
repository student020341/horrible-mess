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
	return "proto"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/proto/index.html")
}

var router RouterModule.SubRouter

func init(){
	// setup router
	router.Register("/", "GET", handleHome)
	// serve files
	router.Register("/file/*", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}){
		http.ServeFile(w, r, "./files/proto/" + r.URL.Path[12:]);
	})
	// fall back to home
	router.Register("*", "GET", handleHome)
}

func main() {
	fmt.Println("ayy")
}
