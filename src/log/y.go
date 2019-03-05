package main

import (
	"fmt"
	"net/http"
	"../lib/RouterModule"
	"io/ioutil"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName () string {
	return "log"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/log/index.html")
}

var router RouterModule.SubRouter

func init(){
	// setup router
	router.Register("/", "GET", handleHome)
	router.Register("/write/:name", "POST", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}){
		post := args["body"].(map[string]interface{})
		route := args["route"].(map[string]string)

		err := ioutil.WriteFile("/opt/te1680/logs/"+route["name"], []byte(post["content"].(string)), 0644)
		if err == nil {
			fmt.Fprint(w, "ok")
		} else {
			fmt.Fprint(w, err.Error())
		}
	})
}

func main() {

}
