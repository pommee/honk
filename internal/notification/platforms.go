package notification

type Platform string

const (
	Slack   Platform = "slack"
	Discord Platform = "discord"
	Teams   Platform = "teams"
)

func levelColor(level string) int {
	switch level {
	case "error":
		return 0xFF0000
	case "warning":
		return 0xFFA500
	default:
		return 0x2ECC71
	}
}
