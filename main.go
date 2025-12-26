package main

import (
	"embed"
	"honk/internal/api"
	"honk/internal/database"
	"honk/internal/monitor"
)

//go:embed client/dist/*
var content embed.FS

func main() {
	db := database.Initialize()

	apiServer := api.API{
		Authentication: false,
		Dashboard:      false,
		Port:           8080,

		Manager: monitor.NewManager(db),
	}
	errorChan := make(chan struct{}, 1)
	apiServer.Manager.RegisterHandler(database.ConnectionTypeHTTP, monitor.NewHTTPPingHandler())
	apiServer.Manager.RegisterHandler(database.ConnectionTypePing, monitor.NewICMPPingHandler(5))
	apiServer.Manager.RegisterHandler(database.ConnectionTypeTCP, monitor.NewTCPPingHandler(5))

	apiServer.Start(content, errorChan)
}
