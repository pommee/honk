package database

import "time"

type Monitor struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"-"`
	Name           string    `json:"name"`
	Connection     string    `json:"connection"`
	ConnectionType int       `json:"connectionType"`
	Interval       int       `json:"interval"`
	Healthy        bool      `json:"healthy"`
	Uptime         float32   `json:"uptime"`
	Checked        time.Time `json:"checked,omitzero"`
	Err            string    `json:"error"`

	TotalChecks      int `json:"-"`
	SuccessfulChecks int `json:"-"`
}

// Saves a report in the case of a monitor error
type MonitorError struct {
	Created time.Time
	Err     string
}
