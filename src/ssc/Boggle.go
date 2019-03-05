package main

import (
	"fmt"
	"net/http"
	"encoding/json"
	"io"
	"../lib/RouterModule"
	"golang.org/x/net/websocket"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName () string {
	return "ssc"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/misc/ssc.html")
}

// client socket handling logic
// todo: handle errors in socketStuff
func handleConnect(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	var handler websocket.Handler = socketStuff
	handler.ServeHTTP(w, r);
}

// simple client struct
type simpleClient struct {
	Id int
	Socket *websocket.Conn
	// buffer position in client struct
	Position Vector2
	Name string
}

type Vector2 struct {
	X float64
	Y float64
}

// list of connected clients
var clients []*simpleClient
// id=0 is the server
var lastId int = 1
func socketStuff(ws *websocket.Conn) {
	fmt.Println("incoming connection:", ws.Request().RemoteAddr)

	clientId := lastId
	lastId += 1

	// tell client its id
	websocket.Message.Send(ws, fmt.Sprintf(`{"id":%d}`, clientId))

	// tell other clients about this client
	otherClientsAddNew(clientId)

	// tell this client about other clients
	if (len(clients) > 0) {
		var otherIds []interface{}
		for _, other := range clients {
			// todo: also send positions, once those are tracked on the back end
			otherIds = append(otherIds, map[string]interface{}{
				"id": other.Id,
				"x": other.Position.X,
				"y": other.Position.Y,
				"name": other.Name,
			})
		}

		encoded, err := json.Marshal(map[string]interface{}{
			"action": "add-clients",
			"clients": otherIds,
		})
		if err != nil {
			// todo: panic?
			return	
		}
		websocket.Message.Send(ws, string(encoded))
	}

	// add this client to the client list
	wsClient := simpleClient{Id: clientId, Socket: ws}
	clients = append(clients, &wsClient)

	var in []byte
	// serve client until it leaves
	for {
		if err := websocket.Message.Receive(ws, &in); err != nil {
			break
		}

		var obj map[string]interface{}
		err := json.Unmarshal(in, &obj)
		if err != nil {
			// weird that user sent nothing, but can be ignored
			if err != io.EOF {
				fmt.Println(err)
			}
			// todo: kick users that spam errors if it becomes an issue
			// ignore errors
			continue
		}

		message, haveMessage := obj["message"]
		// todo: move to function or use broadcast other at least
		if (haveMessage) {
			broadcastToOther(clientId,map[string]interface{}{
				"message": message,
				"client": clientId,
			})
		}

		action, haveAction := obj["action"]
		if (haveAction) {

			// special case
			// todo: pass wsClient instead of id so some of the logic is easier, then do this in handleAction
			if (action == "client-position") {
				wsClient.Position.X = obj["x"].(float64)
				wsClient.Position.Y = obj["y"].(float64)
			}	
			
			if (action == "client-name") {
				wsClient.Name = obj["name"].(string)
			}

			handleAction(clientId, obj)
		}
	}

	// after loop
	
	// drop client from server array
	for index, client := range clients {
		if (client.Socket == ws) {
			// splice client out of collection
			clients = append(clients[:index], clients[index+1:]...)
		}
	}

	// tell clients this client dropped
	otherClientsRemove(clientId)

	fmt.Printf("client %v disconnected\n", clientId)
}

func handleAction (id int, data map[string]interface{}) {
	// todo: handle actions better
	action := data["action"].(string)
	if (action == "client-position") {
		x, haveX := data["x"]
		y, haveY := data["y"]
		if (!haveX || !haveY) {
			return
		}
		
		broadcastToOther(id, map[string]interface{}{
			"client": id,
			"action": action,
			"x": x,
			"y": y,
		})
	} else if (action == "client-name") {
		name, haveName := data["name"];
		if (haveName) {
			broadcastToOther(id, map[string]interface{}{
				"client": id,
				"action": action,
				"name": name,
			})
		}
	}
}

func otherClientsAddNew (id int) {
	broadcastToOther(id, map[string]interface{}{
		"id": 0,
		"action": "client-add",
		"client": id,
	})
}

func otherClientsRemove (id int) {
	broadcastToOther(id, map[string]interface{}{
		"id": 0,
		"action": "client-remove",
		"client": id,
	})
}

// send data to all clients except for id
func broadcastToOther (id int, data interface{}) {

	// get data as json
	encoded, err := json.Marshal(data)
	if err != nil {
		fmt.Println("json encode failed for broadcast other:", err)
		return
	}

	// transmit json to other clients
	for _, client := range clients {
		if (client.Id != id) {
			websocket.Message.Send(client.Socket, string(encoded))
		}
	}
}

var router RouterModule.SubRouter

func init(){
	// setup router
	router.Register("/", "GET", handleHome)
	router.Register("/connect", "GET", handleConnect)
}

func main() {
	fmt.Println("this is")
}

/*
todos:
	- util functions to reduce some boiler plate
	+ broadcast to this client
	+ broadcast to other clients
	+ broadcast to all clients
	+ encode util that accepts a map[string]interface and returns a valid encoded string and logs any errors
	- refactor socket function body out to multiple functions
	- tell new clients about existing clients
	- add position data to client struct

*/
