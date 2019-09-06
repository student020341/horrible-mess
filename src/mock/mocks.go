package main

import (
	"net/http"
	"../lib/RouterModule"
	"encoding/json"
	"math/rand"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {

	router.Handle(w, r, path)
}

func GetName () string {
	return "mock"
}

var router RouterModule.SubRouter

func init(){
	// setup router
	router.Register("/probe_list.json", "GET", func(args map[string]interface{})interface{}{
		sample := `{
			"probe_no": 5,
			"probe_list":[
				{
					"probe_id": 1,
					"probe_type": 0,
					"sensor_name": ["Int. Temp",null],
					"unit_type": [2,16],
					"alert_type": [2,3],
					"warn_range": [[18.00,37.00],[50.00,0.00]],
					"down_range": [[15.00,41.00],[60.00,0.00]],
					"alert_setting": [[0,0,0,0],[0,0,0,0]],
					"output": [null,null],
					"output_state": [0,0],
					"default_state": [null,null]
					
				},
				{
					"probe_id": 2,
					"probe_type": 18,
					"sensor_name": ["Output1","Output2","Output3","Output4"],
					"unit_type": [1,1,1,1],
					"alert_type": [1,1,1,1],
					"warn_range": [[0,0],[0,0],[0,0],[0,0]],
					"down_range": [[0,0],[0,0],[0,0],[0,0]],
					"alert_setting": [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
					"output": [null,null,null,null],
					"output_state": [0,0,0,0],
					"default_state": [0,0,0,0]
				},
				{
					"probe_id": 3,
					"probe_type": 103,
					"sensor_name": ["Ext. Temp2","Ext. Temp3"],
					"unit_type": [2,2],
					"alert_type": [2,2],
					"warn_range": [[18.00,25.00],[18.00,25.00]],
					"down_range": [[15.00,29.00],[15.00,36.00]],
					"alert_setting": [[0,0,0,0],[0,0,0,0]],
					"output": [null,null],
					"output_state": [0,0],
					"default_state": [null,null]
				},
				{
					"probe_id": 4,
					"probe_type": 16,
					"sensor_name": ["Dust Sensor1"],
					"unit_type": [19],
					"alert_type": [3],
					"warn_range": [[0.25,0.00]],
					"down_range": [[0.35,0.00]],
					"alert_setting": [[0,0,0,0]],
					"output": [null],
					"output_state": [0],
					"default_state": [null]
				},
				{
					"probe_id": 5,
					"probe_type": 100,
					"sensor_name": ["Ext. Temp1","Humidity1","Dew Point1","Light1","Shock1","Sound Meter1","Power Fail1","Motion1","Smoke1"],
					"unit_type": [2,4,2,20,7,17,1,1,1],
					"alert_type": [2,2,2,2,2,2,1,1,1],
					"warn_range": [[18.00,25.00],[45.00,65.00],[18.00,25.00],[18.00,37.00],[0.75,1.25],[35.00,100.00],[0.00,0.00],[0.00,0.00],[0.00,0.00]],
					"down_range": [[15.00,31.00],[40.00,70.00],[15.00,29.00],[15.00,41.00],[0.50,1.50],[15.00,80.00],[1.00,0.00],[1.00,0.00],[1.00,0.00]],
					"alert_setting": [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
					"output": [null,null,null,null,null,null,null,null,null],
					"output_state": [0,0,0,0,0,0,0,0,0],
					"default_state": [null,null,null,null,null,null,null,null,null]
				},
				{
					"probe_id": 6,
					"probe_type": 99,
					"sensor_name": [null],
					"unit_type": [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
					"alert_type": [1,1,1,1,1,1,1,1,1,1,1,1],
					"warn_range": [0,0],
					"down_range": [0,0],
					"alert_setting": [0],
					"output": [null],
					"output_state": [null],
					"default_state": [null]
				},
				{
					"probe_id": 7,
					"probe_type": 99,
					"sensor_name": [null],
					"unit_type": [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
					"alert_type": [1,1,1,1,1,1,1,1,1,1,1,1],
					"warn_range": [0,0],
					"down_range": [0,0],
					"alert_setting": [0],
					"output": [null],
					"output_state": [null],
					"default_state": [null]
				},
				{
					"probe_id": 8,
					"probe_type": 99,
					"sensor_name": [null],
					"unit_type": [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
					"alert_type": [1,1,1,1,1,1,1,1,1,1,1,1],
					"warn_range": [0,0],
					"down_range": [0,0],
					"alert_setting": [0],
					"output": [null],
					"output_state": [null],
					"default_state": [null]
				},
				{
					"probe_id": 9,
					"probe_type": 99,
					"sensor_name": [null],
					"unit_type": [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
					"alert_type": [1,1,1,1,1,1,1,1,1,1,1,1],
					"warn_range": [0,0],
					"down_range": [0,0],
					"alert_setting": [0],
					"output": [null],
					"output_state": [null],
					"default_state": [null]
				},
				{
					"probe_id": 10,
					"probe_type": 99,
					"sensor_name": [null],
					"unit_type": [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
					"alert_type": [1,1,1,1,1,1,1,1,1,1,1,1],
					"warn_range": [0,0],
					"down_range": [0,0],
					"alert_setting": [0],
					"output": [null],
					"output_state": [null],
					"default_state": [null]
				},
				{
					"probe_id": 11,
					"probe_type": 99,
					"sensor_name": [null],
					"unit_type": [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
					"alert_type": [1,1,1,1,1,1,1,1,1,1,1,1],
					"warn_range": [0,0],
					"down_range": [0,0],
					"alert_setting": [0],
					"output": [null],
					"output_state": [null],
					"default_state": [null]
				}
			]
		}`
		obj := map[string]interface{}{}
		if err := json.Unmarshal([]byte(sample), &obj); err != nil {
			return err
		}
		
		return obj
	})
	router.Register("/probe_update.json", "GET", func(args map[string]interface{})interface{}{
		sample := getProbeUpdate()
		obj := map[string]interface{}{}
		if err := json.Unmarshal([]byte(sample), &obj); err != nil {
			return err
		}
		
		return obj
	})
	
	//todo: see why * didn't catch /
	router.Register("/", "*", func(args map[string]interface{})interface{}{
		return "available links are /probe_list.json and /probe_update.json"
	})
	router.Register("*", "*", func(args map[string]interface{})interface{}{
		return "available links are /probe_list.json and /probe_update.json"
	})
}

func getProbeUpdate() string {
	which := rand.Intn(3)
	samples := []string{
		`{
			"probe_update":[
				{
					"probe_id": 1,
					"probe_type": 0,
					"status": [1,1],
					"value": [28.18,0.00]
				},
				{
					"probe_id": 2,
					"probe_type": 18,
					"status": [1,1,1,1],
					"value": [0.00,0.00,0.00,0.00]
				},
				{
					"probe_id": 3,
					"probe_type": 103,
					"status": [1,1],
					"value": [19.93,27.79]
				},
				{
					"probe_id": 4,
					"probe_type": 16,
					"status": [1],
					"value": [0.00]
				},
				{
					"probe_id": 5,
					"probe_type": 100,
					"status": [1,1,1,1,1,1,1,1,1],
					"value": [29.25,51.05,36.90,0.00,0.94,43.53,1.00,0.00,0.00]
				},
				{
					"probe_id": 6,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 7,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 8,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 9,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 10,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 11,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				}
			]
		}
		`,
		`{
			"probe_update":[
				{
					"probe_id": 1,
					"probe_type": 0,
					"status": [1,1],
					"value": [28.18,0.00]
				},
				{
					"probe_id": 2,
					"probe_type": 18,
					"status": [1,1,1,1],
					"value": [0.00,0.00,0.00,0.00]
				},
				{
					"probe_id": 3,
					"probe_type": 103,
					"status": [1,1],
					"value": [19.93,27.79]
				},
				{
					"probe_id": 4,
					"probe_type": 16,
					"status": [1],
					"value": [1.00]
				},
				{
					"probe_id": 5,
					"probe_type": 100,
					"status": [1,1,1,1,1,1,1,1,1],
					"value": [29.25,51.05,36.90,0.00,0.94,43.53,1.00,0.00,0.00]
				},
				{
					"probe_id": 6,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 7,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 8,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 9,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 10,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 11,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				}
			]
		}
		`,
		`{
			"probe_update":[
				{
					"probe_id": 1,
					"probe_type": 0,
					"status": [1,1],
					"value": [28.18,0.00]
				},
				{
					"probe_id": 2,
					"probe_type": 18,
					"status": [1,1,1,1],
					"value": [0.00,0.00,0.00,0.00]
				},
				{
					"probe_id": 3,
					"probe_type": 103,
					"status": [1,1],
					"value": [19.93,27.79]
				},
				{
					"probe_id": 4,
					"probe_type": 16,
					"status": [1],
					"value": [2.03]
				},
				{
					"probe_id": 5,
					"probe_type": 100,
					"status": [1,1,1,1,1,1,1,1,1],
					"value": [29.25,51.05,36.90,0.00,0.94,43.53,1.00,0.00,0.00]
				},
				{
					"probe_id": 6,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 7,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 8,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 9,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 10,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				},
				{
					"probe_id": 11,
					"probe_type": 99,
					"status": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
					"value": [0]
				}
			]
		}
		`,
	}

	return samples[which]
}

func main() {
	
}
