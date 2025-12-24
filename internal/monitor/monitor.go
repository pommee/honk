package monitor

type ConnectionType string

const (
	ConnectionTypeHTTP      ConnectionType = "http"
	ConnectionTypePing      ConnectionType = "ping"
	ConnectionTypeContainer ConnectionType = "container"
	ConnectionTypeTCP       ConnectionType = "tcp"
)
