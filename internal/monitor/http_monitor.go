package monitor

import (
	"context"
	"fmt"
	"honk/internal/database"
	"io"
	"net/http"
	"time"
)

type HTTPPingHandler struct {
	Client *http.Client
}

func NewHTTPPingHandler(timeout time.Duration) *HTTPPingHandler {
	return &HTTPPingHandler{
		Client: &http.Client{
			Timeout: timeout,
		},
	}
}

func (h *HTTPPingHandler) Check(ctx context.Context, m *database.Monitor) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, m.Connection, nil)
	if err != nil {
		return "", err
	}

	logger.Debug("HTTP handler '%s' sending request for %s", m.Name, m.Connection)
	resp, err := h.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("http status %d", resp.StatusCode)
	}

	if m.AlwaysSave {
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			logger.Warning("Could not read request body from successful request: %v", err)
		}

		return string(bodyBytes), nil
	}

	return "", nil
}
