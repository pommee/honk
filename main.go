package main

import (
	"embed"
	"honk/internal/api"
	"honk/internal/database"
	"honk/internal/monitor"
	"net/http"
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
	apiServer.Manager.RegisterHandler(0, &monitor.HTTPPingHandler{Client: http.DefaultClient})

	apiServer.Start(content, errorChan)
}
