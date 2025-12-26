package api

import "honk/internal/database"

type NewMonitor struct {
	Enabled        *bool                   `json:"enabled" binding:"required"`
	Name           string                  `json:"name" binding:"required,min=1,max=64"`
	Connection     string                  `json:"connection" binding:"required"`
	ConnectionType database.ConnectionType `json:"connectionType" binding:"required"`
	HTTPMethod     string                  `json:"httpMethod"`
	Timeout        int                     `json:"timeout"`
	Interval       int                     `json:"interval" binding:"required"`
	AlwaysSave     *bool                   `json:"alwaysSave" binding:"required"`
	Notification   database.Notification   `json:"notification"`

	// Headers used for the http monitor
	HttpMonitorHeaders []database.HttpMonitorHeader `json:"headers"`
}

type UpdateMonitor struct {
	ID int `json:"id"`
	NewMonitor
}
