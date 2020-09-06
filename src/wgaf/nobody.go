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
	return "wgaf"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/wgaf/index.html")
}

func init() {
	// fallback to serve home page, REGISTER LAST
	router.Register("*", "*", handleHome)
}

func main() {}

/*
	planned stuff

	buffer some player state
	communication between players
	communicate state between players that need it

	technical details

	send player inputs in realtime
	update player states 1 time per second
*/
