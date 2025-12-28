package notification

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type WebhookNotifier struct {
	URL     string
	Builder PayloadBuilder
	Client  *http.Client
}

func NewWebhookNotifier(url string) *WebhookNotifier {
	var builder PayloadBuilder

	switch {
	case strings.Contains(url, "discord"):
		builder = NewDiscordBuilder()
	case strings.Contains(url, "slack"):
		builder = SlackBuilder{}
	case strings.Contains(url, "teams"):
		builder = TeamsBuilder{}
	default:
		panic("unsupported webhook platform")
	}

	return &WebhookNotifier{
		URL:     url,
		Builder: builder,
		Client:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (w *WebhookNotifier) Send(msg Message) error {
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}

	if err := msg.RenderTemplate(); err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	payload, err := w.Builder.Build(msg)
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
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook returned %d: %s", resp.StatusCode, body)
	}

	return nil
}
