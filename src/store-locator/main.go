package main

import (
	"fmt"
	"net/http"
	"../lib/RouterModule"
	"os/exec"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName () string {
	return "store-locator"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	fmt.Fprint(w, "nothing to see here :)")
}

var router RouterModule.SubRouter

func init(){
	// setup router
	router.Register("/", "GET", handleHome)
	router.Register("/:query", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}){
		route := args["route"].(map[string]string)
		query := args["query"].(map[string]interface{})

		mainQuery := fmt.Sprintf("--address=%s", route["query"])

		unit, ok := query["units"].(string)
		if !ok {
			unit = "mi"
		}

		format, ok := query["output"].(string)
		if !ok {
			format = "text"
		}

		unitOption := fmt.Sprintf("--units=%s", unit)
		formatOption := fmt.Sprintf("--output=%s", format)

		out, err := exec.Command("store-locator", mainQuery, unitOption, formatOption).Output()
		if err != nil {
			panic(err)
		}

		fmt.Fprint(w, string(out))
	});
}
