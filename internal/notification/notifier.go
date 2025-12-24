package notification

import "time"

type Message struct {
	Title     string
	Text      string
	Level     string
	Timestamp time.Time
	Data      map[string]interface{}
}

type Notifier interface {
	Send(msg Message) error
	SendInfo(title, text string) error
	SendError(title, text string) error
	SendWarning(title, text string) error
}
