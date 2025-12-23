package api

type NewMonitor struct {
	Name           string `json:"name" binding:"required,min=1,max=64"`
	Connection     string `json:"connection" binding:"required"`
	ConnectionType int    `json:"connectionType" binding:"min=0"`
	Interval       int    `json:"interval" binding:"required"`
	AlwaysSave     *bool  `json:"alwaysSave" binding:"required"`
}
