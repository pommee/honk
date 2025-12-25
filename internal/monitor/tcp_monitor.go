package monitor

import (
	"context"
	"errors"
	"fmt"
	"honk/internal"
	"honk/internal/database"
	"net"
	"time"
)

var log = internal.GetLogger()

type TCPHandler struct {
	Dialer *net.Dialer
}

func NewTCPPingHandler(timeout time.Duration) *TCPHandler {
	return &TCPHandler{
		Dialer: &net.Dialer{Timeout: timeout},
	}
}

func (h *TCPHandler) Check(ctx context.Context, m *database.Monitor) (string, int64, error) {
	log.Info("Running tcp check for monitor '%s'", m.Name)

	start := time.Now()
	conn, err := h.Dialer.DialContext(ctx, "tcp", m.Connection)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return "TCP connection timed out", duration, err
		}
		return fmt.Sprintf("TCP connection failed: %v", err), duration, err
	}

	defer conn.Close()

	return fmt.Sprintf("Successfully connected to %s", m.Connection), duration, nil
}
