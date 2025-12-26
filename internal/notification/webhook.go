package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"honk/internal"
	"io"
	"net/http"
	"time"
)

var log = internal.GetLogger()

type WebhookNotifier struct {
	URL      string
	Platform Platform
	Client   *http.Client
}

func NewWebhookNotifier(url string, platform Platform) *WebhookNotifier {
	return &WebhookNotifier{
		URL:      url,
		Platform: platform,
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (w *WebhookNotifier) Send(msg Message) error {
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}

	payload, err := w.buildPayload(msg)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", w.URL, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "honk-notifier/1.0")

	resp, err := w.Client.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Warning("failed to close response body: %v", closeErr)
		}
	}()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("%s webhook returned %d: %s", w.Platform, resp.StatusCode, body)
	}

	return nil
}

func (w *WebhookNotifier) SendInfo(t, m string) error {
	return w.Send(Message{Title: t, Text: m, Level: "info"})
}

func (w *WebhookNotifier) SendError(t, m string) error {
	return w.Send(Message{Title: t, Text: m, Level: "error"})
}

func (w *WebhookNotifier) SendWarning(t, m string) error {
	return w.Send(Message{Title: t, Text: m, Level: "warning"})
}

func (w *WebhookNotifier) buildPayload(msg Message) ([]byte, error) {
	switch w.Platform {
	case Discord:
		return json.Marshal(map[string]any{
			"embeds": []map[string]any{
				{
					"title":       msg.Title,
					"description": msg.Text,
					"color":       levelColor(msg.Level),
					"timestamp":   msg.Timestamp.Format(time.RFC3339),
				},
			},
		})

	case Slack:
		return json.Marshal(map[string]any{
			"text": fmt.Sprintf("*%s*\n%s", msg.Title, msg.Text),
		})

	case Teams:
		return json.Marshal(map[string]any{
			"@type":      "MessageCard",
			"@context":   "http://schema.org/extensions",
			"summary":    msg.Title,
			"themeColor": fmt.Sprintf("%06X", levelColor(msg.Level)),
			"title":      msg.Title,
			"text":       msg.Text,
		})

	default:
		return nil, fmt.Errorf("unsupported platform: %s", w.Platform)
	}
}
