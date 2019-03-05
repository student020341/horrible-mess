package RouterModule

import (
	"fmt"
	"strings"
	"net/http"
	"encoding/json"
	"io"
)

type SubRoute struct {
	Path []string
	Method string
	Handler interface{}
}

type SubRouter struct {
	Routes []SubRoute
}

func fixPath (path []string) []string {
	var tmp []string
	for _, value := range path {
		if value != "" {
			tmp = append(tmp, value)
		}
	}
	return tmp
}

func (route *SubRoute) GetRouteParams (path []string) map[string]string {
	args := make(map[string]string)
	for index, routeChunk := range route.Path {
		if string(routeChunk[0]) == ":" {
			args[routeChunk[1:]] = path[index]
		}
	}
	return args
}

func GetQueryParams (r *http.Request) map[string]interface{} {
	obj := make(map[string]interface{})

	for key, value := range r.URL.Query() {
		if len(value) < 2 {
			obj[key] = value[0]
		} else {
			obj[key] = value
		}
	}

	return obj
}

func GetRequestBody (r *http.Request) map[string]interface{} {
	if r.Body == nil {
		return nil
	}

	var obj map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&obj)
	if err != nil {
		if err != io.EOF {
			fmt.Println(err)
		}
		return nil
	}

	return obj
}

func (route *SubRoute) MatchPath (path []string, method string) bool {
	if route.Method != "*" && method != route.Method {
		return false
	}
	// todo: should glob index be stored on the route? should other calculated properties be cached somewhere?
	globIndex := -1
	for index, value := range route.Path {
		if value == "*" {
			globIndex = index
			break
		}
	}
	if len(path) != len(route.Path) && (globIndex == -1 || globIndex >= len(path)) {
		// if there is a glob, the request /shirt/file/img/something.png could match /shirt/file/*
		// can also be used to have another sub router
		return false
	} else if len(path) == 0 && len(route.Path) == 0 {
		// root
		return true
	}
	for index, pathVal := range path {
		routeVal := route.Path[index]
		// can potentially catch everything if someone registered /* first which would be dumb
		// but that can also function as a 404 route if registered last
		if routeVal == "*" {
			return true
		}
		if routeVal != pathVal && string(routeVal[0]) != ":" {
			return false
		}
	}
	return true
}

// add route to router
func (router *SubRouter) Register (uri string, method string, handler interface{}) {
	router.Routes = append(router.Routes, SubRoute{
		Path: fixPath(strings.Split(uri, "/")),
		Method: method,
		Handler: handler,
	})
}

// default handler
func (router *SubRouter) Handle (w http.ResponseWriter, r *http.Request, path []string) {

	var response interface{}
	haveMatch := false
	writeResponse := false

	// find a path match
	for _, sub := range router.Routes {
		if sub.MatchPath(path, r.Method) {
			haveMatch = true
			// get search string, request body, and url params
			args := make(map[string]interface{})
			// map[string]string
			args["route"] = sub.GetRouteParams(path)
			// map[string]interface{}
			args["body"] = GetRequestBody(r)
			// map[string]interface{}
			args["query"] = GetQueryParams(r)
			// identify type of sub route handler
			switch t := sub.Handler.(type) {
				// simplified handler that returns json
				case func(map[string]interface{})interface{}:
					writeResponse = true
					response = t(args)
				// generic handler that will write its own response to client
				case func(w http.ResponseWriter, r *http.Request, args map[string]interface{}):
					t(w, r, args)
			}
			break
		}
	}

	if haveMatch && writeResponse {
		encoded, err := json.Marshal(response)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, "failed to encode response")
		} else {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintf(w, "%v", string(encoded))
		}
	} else if (!haveMatch) {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "unhandled request")
	}
}

/*
simple route matching - done
route parameters - done
request body - done
query / search parameters - done
route globbing - done
method consideration - done

*/