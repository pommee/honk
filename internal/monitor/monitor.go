package monitor

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
