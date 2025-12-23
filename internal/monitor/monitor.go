package monitor

import "honk/internal/database"

type ConnectionType int

const (
	ConnectionTypeHTTP ConnectionType = iota
	ConnectionTypePing
	ConnectionTypeContainer
	ConnectionTypeTCP
)

var connectionTypeName = map[ConnectionType]string{
	ConnectionTypeHTTP:      "http",
	ConnectionTypePing:      "ping",
	ConnectionTypeContainer: "container",
	ConnectionTypeTCP:       "tcp",
}

func (ct ConnectionType) String() string {
	return connectionTypeName[ct]
}

func NewMonitor(name string, connectionType ConnectionType, connection string, interval int) *database.Monitor {
	return &database.Monitor{
		Name:           name,
		ConnectionType: int(connectionType),
		Connection:     connection,
		Interval:       interval,
	}
}
