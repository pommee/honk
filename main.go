package main

import (
	"embed"
	"honk/internal/api"
	"honk/internal/database"
	"honk/internal/monitor"
)

var (
	version, commit, date string

	//go:embed client/dist/*
	content embed.FS
)

func main() {
	db := database.Initialize()

	manager := monitor.NewManager(db)
	apiServer := api.API{
		Authentication: false,
		Dashboard:      false,
		Port:           8080,

		Manager: manager,
	}
	errorChan := make(chan struct{}, 1)

	manager.RegisterHandler(database.ConnectionTypeHTTP, monitor.NewHTTPPingHandler())
	manager.RegisterHandler(database.ConnectionTypePing, monitor.NewICMPPingHandler(5))
	manager.RegisterHandler(database.ConnectionTypeTCP, monitor.NewTCPPingHandler(5))
	manager.Start()

	apiServer.Start(content, errorChan, version, commit, date)
}
