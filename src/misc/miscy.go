package main

import (
	"github.com/student020341/LearningGolang/src/lib/RouterModule"
	"net/http"
	"strconv"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName() string {
	return "misc"
}

var router RouterModule.SubRouter

func init() {
	// setup router
	router.Register("/file/*", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
		http.ServeFile(w, r, "./files/misc/"+r.URL.Path[11:])
	})
	// test status codes
	router.Register("/code/:code", "*", func(args map[string]interface{}) interface{} {
		route := args["route"].(map[string]string)
		status, err := strconv.Atoi(route["code"])

		var code int
		var msg string
		if err != nil {
			code = 500
			msg = err.Error()
		} else {
			code = status
			msg = "testing status code"
		}

		return map[string]interface{}{
			"HTTPStatusCode": code,
			"status":         msg,
		}
	})
}

func main() {

}
