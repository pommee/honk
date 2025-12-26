package notification

type Platform string
type Level string

const (
	Slack   Platform = "slack"
	Discord Platform = "discord"
	Teams   Platform = "teams"

	Success Level = "success"
	Warning Level = "warning"
	Error   Level = "error"
)

func levelColor(level Level) int {
	switch level {
	case Error:
		return 0xFF0000
	case Warning:
		return 0xFFA500
	case Success:
		return 0x2ECC71
	}

	return 0
}
