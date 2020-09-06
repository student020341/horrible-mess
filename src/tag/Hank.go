// this is a clone of the ssc test, but with the addition of tag logic
// leaving ssc alone so it can be a boiler plate base
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/student020341/LearningGolang/src/lib/RouterModule"
	"golang.org/x/net/websocket"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName() string {
	return "tag"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/misc/tag.html")
}

// client socket handling logic
// todo: handle errors in socketStuff
func handleConnect(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	var handler websocket.Handler = socketStuff
	handler.ServeHTTP(w, r)
}

// simple client struct
type simpleClient struct {
	Id     int
	Socket *websocket.Conn
	// buffer position in client struct
	Position    Vector2
	WorldFreeze bool
	Tagged      bool
}

type Vector2 struct {
	X float64
	Y float64
}

// todo: world struct with more info?
var WorldIsFrozen bool = false

// list of connected clients
var clients []*simpleClient

// id=0 is the server
var lastId int = 1

func socketStuff(ws *websocket.Conn) {
	fmt.Println("incoming connection:", ws.Request().RemoteAddr)
	// if this is the first player, tag them
	ensureSomeoneIsTagged()

	clientId := lastId
	lastId += 1

	// tell client its id
	websocket.Message.Send(ws, fmt.Sprintf(`{"id":%d}`, clientId))

	// tell this client about other clients
	if len(clients) > 0 {
		var otherIds []interface{}
		for _, other := range clients {
			// todo: also send positions, once those are tracked on the back end
			otherIds = append(otherIds, map[string]interface{}{
				"id":     other.Id,
				"x":      other.Position.X,
				"y":      other.Position.Y,
				"tagged": other.Tagged,
				"focus":  other.WorldFreeze,
			})
		}

		encoded, err := json.Marshal(map[string]interface{}{
			"action":  "add-clients",
			"clients": otherIds,
		})
		if err != nil {
			// todo: panic?
			return
		}
		websocket.Message.Send(ws, string(encoded))
	}

	// add this client to the client list
	wsClient := simpleClient{Id: clientId, Socket: ws, WorldFreeze: false, Tagged: false}
	clients = append(clients, &wsClient)

	// tell other clients about this client
	otherClientsAddNew(&wsClient)

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

		action, haveAction := obj["action"]
		if haveAction {

			// special case
			// todo: set this in handleAction now that client is passed along
			if action == "client-position" {
				wsClient.Position.X = obj["x"].(float64)
				wsClient.Position.Y = obj["y"].(float64)
			}

			handleAction(&wsClient, obj)
		}
	}

	// after loop

	// drop client from server array
	for index, client := range clients {
		if client.Socket == ws {
			// splice client out of collection
			clients = append(clients[:index], clients[index+1:]...)
		}
	}

	// tell clients this client dropped
	otherClientsRemove(&wsClient)

	fmt.Printf("client %v disconnected\n", clientId)
	// if the person who was IT left, tag someone else
	ensureSomeoneIsTagged()
}

func handleAction(client *simpleClient, data map[string]interface{}) {
	// todo: handle actions better
	action := data["action"].(string)
	if action == "client-position" {
		x, haveX := data["x"]
		y, haveY := data["y"]
		if !haveX || !haveY {
			return
		}

		broadcastToOther(client, map[string]interface{}{
			"client": client.Id,
			"action": action,
			"x":      x,
			"y":      y,
		})
	} else if action == "world-freeze" {
		client.WorldFreeze = true
		updateWorldFrozen()
		broadcastToOther(client, map[string]interface{}{
			"action": "client-particles",
			"value":  1,
			"client": client.Id,
		})
	} else if action == "world-unfreeze" {
		client.WorldFreeze = false
		updateWorldFrozen()
		broadcastToOther(client, map[string]interface{}{
			"action": "client-particles",
			"value":  0,
			"client": client.Id,
		})
	} else if action == "tag" {
		newTag := data["client"].(string)
		tagNum, err := strconv.Atoi(newTag)
		if err == nil {
			tagBroadcast(tagNum)
		} else {
			// something went wrong and the client will already be untagged on client side, so re-tag them
			tagBroadcast(client.Id)
		}
	}
}

// if no one is tagged and we have at least 1 client, tag that first client
func ensureSomeoneIsTagged() {
	for _, client := range clients {
		// we don't need to do anything
		if client.Tagged {
			return
		}
	}

	// didn't find anyone already tagged, check if we have any players
	if len(clients) > 0 {
		// unfairly set the first client to IT
		tagBroadcast(clients[0].Id)
	}
}

// set the given client to tagged and unset anyone else
func tagBroadcast(newTag int) {
	for _, client := range clients {
		if newTag == client.Id {
			client.Tagged = true
		} else {
			client.Tagged = false
		}
	}

	// clients will unset their tagged value unless it matches the incoming client id
	broadcastToAll(map[string]interface{}{
		"id":     0,
		"action": "tag",
		"client": newTag,
	})
}

// todo: this might need a mutex lock
func updateWorldFrozen() {
	frozen := false
	for _, client := range clients {
		if client.WorldFreeze {
			frozen = true
			break
		}
	}

	if frozen != WorldIsFrozen {
		WorldIsFrozen = frozen
		var nextWorldState string
		if frozen {
			nextWorldState = "freeze"
		} else {
			nextWorldState = "unfreeze"
		}

		broadcastToAll(map[string]interface{}{
			"id":     0,
			"action": nextWorldState,
		})
	}
}

func otherClientsAddNew(client *simpleClient) {
	broadcastToOther(client, map[string]interface{}{
		"id":     0,
		"action": "client-add",
		"client": client.Id,
	})
}

func otherClientsRemove(client *simpleClient) {
	broadcastToOther(client, map[string]interface{}{
		"id":     0,
		"action": "client-remove",
		"client": client.Id,
	})
}

// send data to all clients except for id
func broadcastToOther(client *simpleClient, data interface{}) {

	// get data as json
	encoded, err := json.Marshal(data)
	if err != nil {
		fmt.Println("json encode failed for broadcast other:", err)
		return
	}

	// transmit json to other clients
	for _, aClient := range clients {
		if aClient != client {
			websocket.Message.Send(aClient.Socket, string(encoded))
		}
	}
}

func broadcastToAll(data interface{}) {
	encoded, err := json.Marshal(data)
	if err != nil {
		fmt.Println("json encode failed for broadcast all:", err)
		return
	}

	for _, client := range clients {
		websocket.Message.Send(client.Socket, string(encoded))
	}
}

var router RouterModule.SubRouter

func init() {
	// setup router
	router.Register("/", "GET", handleHome)
	router.Register("/connect", "GET", handleConnect)
}

func main() {
	fmt.Println("this is a copy of")
}
