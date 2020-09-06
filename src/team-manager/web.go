package main

import (
	"net/http"
	"../lib/RouterModule"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"fmt"
	"os"
)

func HandleWeb(w http.ResponseWriter, r *http.Request, path []string) {
	router.Handle(w, r, path)
}

func GetName() string {
	return "tm"
}

func handleHome(w http.ResponseWriter, r *http.Request, args map[string]interface{}) {
	http.ServeFile(w, r, "./files/team-manager/index.html")
}

func getConnection() (*sql.DB, error) {
	return sql.Open("sqlite3", "./files/team-manager/team.db")
}

func getTeams(args map[string]interface{}) interface{} {
	handle := func(err error) interface{} {
		return map[string]interface{}{
			"HTTPStatusCode": 500,
			"status": err.Error(),
		}
	}
	// get db connection
	dbh, err := getConnection()
	if err != nil {
		return handle(err)
	}
	defer dbh.Close()

	// get teams
	rows, err := dbh.Query("select * from teams")
	if err != nil {
		return handle(err)
	}
	defer rows.Close()
	var teams []interface{}
	for rows.Next() {
		var id int
		var name string
		err = rows.Scan(&id, &name)
		if err == nil {
			teams = append(teams, map[string]interface{}{
				"id": id,
				"name": name,
			})
		}
	}

	// return teams
	return map[string]interface{}{
		"teams": teams,
	}
}

// func handleSQL(args map[string]interface{}) interface{} {

// 	dbh, err := getConnection()
// 	if err != nil {
// 		panic(err)
// 	}
// 	defer dbh.Close()

// 	// tx, err := dbh.Begin()
// 	// if err != nil {
// 	// 	panic(err)
// 	// }

// 	// stmt, err := tx.Prepare("insert into teams (name) values (?), (?)")
// 	// if err != nil {
// 	// 	panic(err)
// 	// }
// 	// defer stmt.Close()
// 	// stmt.Exec("test1", "test2")
// 	// tx.Commit()
// }

func setupDb() {
	fmt.Println("setup db")
	// determine if db exists
	_, err := os.Stat("./files/team-manager/team.db")
	if (err == nil) {
		// db exists
		return
	} else if (!os.IsNotExist(err)) {
		// error other than file not existing
		panic(err)
	}

	fmt.Println("create tables")

	dbh, err := sql.Open("sqlite3", "./files/team-manager/team.db")
	if err != nil {
		panic(err)
	}
	defer dbh.Close()

	createDbSql := `
	create table teams (
		id integer primary key, 
		name text
	);
	create table users (
		id integer primary key, 
		first_name text,
		last_name text
	);
	create table applications (
		id integer primary key,
		name text,
		link text
	);
	create table roles (
		application_id integer,
		user_id integer,
		role text
	);
	create table team_applications (
		application_id integer,
		team_id integer
	);
	`

	_, err = dbh.Exec(createDbSql)
	if err != nil {
		panic(err)
	}
}

var router RouterModule.SubRouter

func init(){
	// db stuff
	setupDb()

	// setup router
	// serve home page
	router.Register("/", "GET", handleHome)
	// serve files for the project
	router.Register("/file/*", "GET", func(w http.ResponseWriter, r *http.Request, args map[string]interface{}){
		http.ServeFile(w, r, "./files/team-manager/" + r.URL.Path[19:]);
	})

	// sql
	router.Register("/teams", "GET", getTeams)

	// register last to avoid catching all requests
	// serve index for vue history mode
	router.Register("*", "GET", handleHome)
}

func main() {
	
}
