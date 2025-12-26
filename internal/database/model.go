package database

import "time"

type ConnectionType string

const (
	ConnectionTypeHTTP      ConnectionType = "http"
	ConnectionTypePing      ConnectionType = "ping"
	ConnectionTypeContainer ConnectionType = "container"
	ConnectionTypeTCP       ConnectionType = "tcp"
)

type Monitor struct {
	ID               uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Enabled          bool           `json:"enabled"`
	Name             string         `json:"name"`
	Connection       string         `json:"connection"`
	ConnectionType   ConnectionType `json:"connectionType"`
	HTTPMethod       string         `json:"httpMethod"`
	Interval         int            `json:"interval"`
	Healthy          *bool          `json:"healthy"` // nil if unknown
	AlwaysSave       bool           `json:"alwaysSave"`
	Checked          time.Time      `json:"checked,omitzero"`
	Result           string         `json:"result"`
	TotalChecks      int            `json:"totalChecks"`
	SuccessfulChecks int            `json:"successfulChecks"`

	// Optional fields depending on the connection type
	HttpMonitorHeaders []HttpMonitorHeader `gorm:"foreignKey:MonitorID" json:"headers"`

	// Related database fields
	Notification Notification   `gorm:"foreignKey:MonitorID" json:"notification,omitzero"`
	Checks       []MonitorCheck `gorm:"foreignKey:MonitorID" json:"checks"`
}

type MonitorCheck struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"-"`
	MonitorID      uint      `gorm:"index;not null" json:"-"`
	Created        time.Time `json:"created"`
	Success        bool      `json:"success"`
	Result         string    `json:"result,omitempty"`
	ResponseTimeMs int64     `json:"responseTimeMs"`

	Monitor Monitor `gorm:"foreignKey:MonitorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

type Notification struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	MonitorID uint   `gorm:"uniqueIndex;not null" json:"monitorID"`
	Enabled   bool   `json:"enabled"`
	Type      string `json:"type"`
	Webhook   string `json:"webhook"`
	Email     string `json:"email"`
}

type HttpMonitorHeader struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	MonitorID uint   `gorm:"index;not null" json:"-"`
	Key       string `json:"key"`
	Value     string `json:"value"`
}
