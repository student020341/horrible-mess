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

func handleHome (args map[string]interface{})interface{} {

	body := args["body"].(map[string]interface{})

	flags := "-r"
	if (body["fileOnly"].(bool)) {
		flags += "l"
	} else {
		flags += "n"
	}

	if (body["eval"].(bool)) {
		flags += "E"
	} else {
		flags += "F"
	}

	if (!body["matchCase"].(bool)) {
		flags += "i"
	}

	text, err := exec.Command("grep", "--color=always", flags, "--", body["text"].(string), body["dir"].(string)).Output()
	if err == nil {
		return map[string]interface{} {
			"output": string(text),
		};
	} else {
		return map[string]interface{} {
			"status": err.Error(),
		};
	}
}

func GetName () string {
	return "gerp"
}

var router RouterModule.SubRouter

func init(){
	router.Register("/", "REPORT", handleHome);
}

func main() {
	fmt.Println("fmt stuff")
}
