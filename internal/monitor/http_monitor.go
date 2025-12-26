package monitor

import (
	"context"
	"fmt"
	"honk/internal/database"
	"io"
	"net/http"
	"time"
)

const (
	DEFAULT_TIMEOUT = 30 * time.Second
)

type HTTPPingHandler struct{}

func NewHTTPPingHandler() *HTTPPingHandler {
	return &HTTPPingHandler{}
}

func (h *HTTPPingHandler) Check(ctx context.Context, m *database.Monitor) (string, int64, error) {
	timeout := time.Duration(m.Timeout) * time.Second
	if timeout <= 0 {
		timeout = DEFAULT_TIMEOUT
	}

	checkCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(checkCtx, m.HTTPMethod, m.Connection, nil)
	if err != nil {
		return fmt.Sprintf("Failed to create request to %s: %v", m.Connection, err), 0, err
	}

	log.Debug("HTTP handler '%s' sending request to %s (timeout: %v)", m.Name, m.Connection, timeout)

	for _, header := range m.HttpMonitorHeaders {
		req.Header.Add(header.Key, header.Value)
	}

	client := &http.Client{Timeout: timeout}

	start := time.Now()
	resp, err := client.Do(req)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		return fmt.Sprintf("Request to %s failed after %dms: %v", m.Connection, duration, err), duration, err
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Warning("failed to close response body: %v", closeErr)
		}
	}()

	var bodyMsg string
	if resp.StatusCode >= 400 || m.AlwaysSave {
		// Limit body reading to avoid huge responses
		limitReader := io.LimitReader(resp.Body, 1024)
		if bodyBytes, readErr := io.ReadAll(limitReader); readErr == nil && len(bodyBytes) > 0 {
			bodyMsg = "\n" + string(bodyBytes)
		}
	}

	if resp.StatusCode >= 400 {
		errMsg := fmt.Sprintf("HTTP %d %s after %dms from %s", resp.StatusCode, http.StatusText(resp.StatusCode), duration, m.Connection)
		return errMsg + bodyMsg, duration, fmt.Errorf("http status %d", resp.StatusCode)
	}

	if m.AlwaysSave {
		return bodyMsg, duration, nil
	}

	return "", duration, nil
}
