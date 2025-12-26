package notification

import (
	"encoding/json"
	"time"
)

type DiscordBuilder struct {
	Username  string
	AvatarURL string
}

func NewDiscordBuilder() DiscordBuilder {
	return DiscordBuilder{
		Username:  "Honk",
		AvatarURL: "https://github.com/pommee/honk/blob/main/resources/mascot.png?raw=true",
	}
}

func (d DiscordBuilder) Build(msg Message) ([]byte, error) {
	return json.Marshal(map[string]any{
		"content":    " ",
		"username":   d.Username,
		"avatar_url": d.AvatarURL,
		"embeds": []map[string]any{
			{
				"author": map[string]any{
					"name":     d.Username,
					"icon_url": d.AvatarURL,
				},
				"title":       msg.Title,
				"description": msg.Text,
				"color":       levelColor(msg.Level),
				"timestamp":   msg.Timestamp.Format(time.RFC3339),
			},
		},
	})
}
