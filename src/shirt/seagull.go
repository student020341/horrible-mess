package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/student020341/LearningGolang/src/lib/RouterModule"
)

// the universe began on 11/12/2018
var TheBeginning time.Time
var ShirtMatrix [][]string

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName() string {
	return "shirt"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/shirt/index.html")
}

func handleDate(args map[string]interface{}) interface{} {

	body := args["body"].(map[string]interface{})
	requestedDateString := body["date"].(string)

	requestedDate, err := time.Parse(time.RFC3339, requestedDateString)
	if err != nil {
		fmt.Println(err)
		return map[string]interface{}{
			"status": "error parsing time",
		}
	}

	timeDiff := requestedDate.Sub(TheBeginning)
	days := int(timeDiff.Hours() / 24)
	if days < 0 {
		return map[string]interface{}{
			"status": fmt.Sprintf("Error: your request predates the beginning of time by %v days", -days),
		}
	}

	dayOfWeek := days % 7
	matrixOffset := (days / 7) % 5

	if dayOfWeek > 4 {
		return map[string]interface{}{
			"status": "it's a weekend, who knows",
		}
	}

	return map[string]interface{}{
		"days-since-zero": days,
		"number":          dayOfWeek,
		"offset":          matrixOffset,
		"color":           ShirtMatrix[matrixOffset][dayOfWeek],
	}
}

var router RouterModule.SubRouter

func init() {
	// skipping error check on constant
	TheBeginning, _ = time.Parse(time.RFC3339, "2018-11-12T00:00:00Z")
	fmt.Println("time since the beginning:", time.Since(TheBeginning))
	// shirt matrix
	ShirtMatrix = [][]string{
		[]string{"black", "red", "green", "blue", "purple"},
		[]string{"purple", "black", "red", "green", "blue"},
		[]string{"blue", "purple", "black", "red", "green"},
		[]string{"green", "blue", "purple", "black", "red"},
		[]string{"red", "green", "blue", "purple", "black"},
	}
	// setup router
	router.Register("/", "GET", handleHome)
	router.Register("/date", "REPORT", handleDate)
	router.Register("*", "*", func(map[string]interface{}) interface{} {
		return map[string]interface{}{
			"status": "I hope you find what you're looking for, someday.",
		}
	})
}

func main() {

}
