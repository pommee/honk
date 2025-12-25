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
		Client: http.DefaultClient,
	}
}

func (h *HTTPPingHandler) Check(ctx context.Context, m *database.Monitor) (string, int64, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, m.Connection, nil)
	if err != nil {
		return fmt.Sprintf("Failed to create request to %s: %v", m.Connection, err), 0, err
	}

	logger.Debug("HTTP handler '%s' sending request to %s", m.Name, m.Connection)

	start := time.Now()
	resp, err := h.Client.Do(req)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		return fmt.Sprintf("Request to %s failed after %dms: %v", m.Connection, duration, err), duration, err
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			logger.Warning("failed to close response body: %v", closeErr)
		}
	}()

	var bodyMsg string
	if resp.StatusCode >= 400 || m.AlwaysSave {
		limitReader := io.LimitReader(resp.Body, 1024*64)
		bodyBytes, readErr := io.ReadAll(limitReader)
		if readErr == nil && len(bodyBytes) > 0 {
			bodyMsg = "\n\n" + string(bodyBytes)
		}
	}

	if resp.StatusCode >= 400 {
		errMsg := fmt.Sprintf("HTTP %d %s after %dms from %s", resp.StatusCode, http.StatusText(resp.StatusCode), duration, m.Connection)
		return errMsg + bodyMsg, duration, fmt.Errorf("http status %d", resp.StatusCode)
	}

	successMsg := fmt.Sprintf("HTTP %d %s after %dms from %s", resp.StatusCode, http.StatusText(resp.StatusCode), duration, m.Connection)
	if m.AlwaysSave {
		successMsg += bodyMsg
	}

	return successMsg, duration, nil
}
