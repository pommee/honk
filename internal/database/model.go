package database

import "time"

type Monitor struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Enabled        bool      `json:"enabled"`
	Name           string    `json:"name"`
	Connection     string    `json:"connection"`
	ConnectionType int       `json:"connectionType"`
	Interval       int       `json:"interval"`
	Healthy        *bool     `json:"healthy"` // nil if unknown
	AlwaysSave     bool      `json:"alwaysSave"`
	Uptime         float32   `json:"uptime"`
	Checked        time.Time `json:"checked,omitzero"`
	Result         string    `json:"result"`

	TotalChecks      int `json:"-"`
	SuccessfulChecks int `json:"-"`

	Notification Notification `gorm:"foreignKey:MonitorID" json:"notification"`

	Checks []MonitorCheck `gorm:"foreignKey:MonitorID" json:"checks"`
}

type MonitorCheck struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"-"`
	MonitorID uint      `gorm:"index;not null" json:"-"`
	Created   time.Time `json:"created"`
	Success   bool      `json:"success"`
	Result    string    `json:"result,omitempty"`

	Monitor Monitor `gorm:"foreignKey:MonitorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

type Notification struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	MonitorID uint   `gorm:"uniqueIndex;not null" json:"monitorID"`
	Type      string `json:"type"`
	Webhook   string `json:"webhook"`
}
