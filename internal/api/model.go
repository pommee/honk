package api

import "honk/internal/database"

type NewMonitor struct {
	Enabled        *bool                 `json:"enabled" binding:"required"`
	Name           string                `json:"name" binding:"required,min=1,max=64"`
	Connection     string                `json:"connection" binding:"required"`
	ConnectionType int                   `json:"connectionType" binding:"min=0"`
	Interval       int                   `json:"interval" binding:"required"`
	AlwaysSave     *bool                 `json:"alwaysSave" binding:"required"`
	Notification   database.Notification `json:"notification"`
}

type UpdateMonitor struct {
	ID int `json:"id"`
	NewMonitor
}
