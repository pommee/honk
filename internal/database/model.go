package database

import "time"

type Monitor struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string    `json:"name"`
	Connection     string    `json:"connection"`
	ConnectionType int       `json:"connectionType"`
	Interval       int       `json:"interval"`
	Healthy        bool      `json:"healthy"`
	AlwaysSave     bool      `json:"alwaysSave"`
	Uptime         float32   `json:"uptime"`
	Checked        time.Time `json:"checked,omitzero"`
	Err            string    `json:"error"`

	TotalChecks      int `json:"-"`
	SuccessfulChecks int `json:"-"`

	Checks []MonitorCheck `gorm:"foreignKey:MonitorID" json:"checks"`
}

type MonitorCheck struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"-"`
	MonitorID uint      `gorm:"index;not null" json:"-"`
	Created   time.Time `json:"created"`
	Success   bool      `json:"success"`
	Err       string    `json:"error,omitempty"`

	Monitor Monitor `gorm:"foreignKey:MonitorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}
