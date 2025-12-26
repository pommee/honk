package notification

import (
	"encoding/json"
	"fmt"
)

type TeamsBuilder struct{}

func (TeamsBuilder) Build(msg Message) ([]byte, error) {
	return json.Marshal(map[string]any{
		"@type":      "MessageCard",
		"@context":   "http://schema.org/extensions",
		"summary":    msg.Title,
		"title":      msg.Title,
		"text":       msg.Text,
		"themeColor": fmt.Sprintf("%06X", levelColor(msg.Level)),
	})
}
