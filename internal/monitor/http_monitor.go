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

func (h *HTTPPingHandler) Check(ctx context.Context, m *database.Monitor) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, m.Connection, nil)
	if err != nil {
		return fmt.Sprintf("Failed to create request to %s: %v", m.Connection, err), err
	}

	logger.Debug("HTTP handler '%s' sending request to %s", m.Name, m.Connection)

	resp, err := h.Client.Do(req)
	if err != nil {
		return fmt.Sprintf("Request to %s failed: %v", m.Connection, err), err
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			logger.Warning("failed to close response body: %v", closeErr)
		}
	}()

	if resp.StatusCode >= 400 {
		errMsg := fmt.Sprintf("HTTP %d %s", resp.StatusCode, http.StatusText(resp.StatusCode))

		bodyBytes, readErr := io.ReadAll(io.LimitReader(resp.Body, 1024*64)) // limit to 64KB
		if readErr == nil && len(bodyBytes) > 0 {
			errMsg += "\n\n" + string(bodyBytes)
		}

		return errMsg, fmt.Errorf("http status %d", resp.StatusCode)
	}

	successMsg := fmt.Sprintf("HTTP %d %s from %s", resp.StatusCode, http.StatusText(resp.StatusCode), m.Connection)

	if m.AlwaysSave {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			logger.Warning("Could not read body from successful request: %v", readErr)
			return successMsg + "\n\n<failed to read body>", nil
		}
		if len(bodyBytes) > 0 {
			successMsg += "\n\n" + string(bodyBytes)
		}
	}

	return successMsg, nil
}
