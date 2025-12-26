package notification

import (
	"encoding/json"
	"fmt"
)

type SlackBuilder struct{}

func (SlackBuilder) Build(msg Message) ([]byte, error) {
	return json.Marshal(map[string]any{
		"text": fmt.Sprintf("*%s*\n%s", msg.Title, msg.Text),
	})
}
