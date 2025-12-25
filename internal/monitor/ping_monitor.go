package monitor

import (
	"context"
	"fmt"
	"honk/internal/database"
	"os/exec"
	"runtime"
	"time"
)

type ICMPPingHandler struct {
	Timeout time.Duration
}

func NewICMPPingHandler(timeout time.Duration) *ICMPPingHandler {
	return &ICMPPingHandler{
		Timeout: timeout,
	}
}

func (h *ICMPPingHandler) Check(ctx context.Context, m *database.Monitor) (string, int64, error) {
	host := m.Connection

	var cmd *exec.Cmd

	start := time.Now()
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.CommandContext(
			ctx,
			"ping",
			"-c", "1",
			"-W", fmt.Sprintf("%d", h.Timeout.Milliseconds()),
			host,
		)
	default:
		timeoutSeconds := int(h.Timeout.Seconds())
		if timeoutSeconds < 1 {
			timeoutSeconds = 1
		}

		cmd = exec.CommandContext(
			ctx,
			"ping",
			"-c", "1",
			"-W", fmt.Sprintf("%d", timeoutSeconds),
			host,
		)
	}
	duration := time.Since(start).Milliseconds()

	logger.Debug("ICMP handler '%s' pinging %s", m.Name, host)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Sprintf(
			"Ping to %s failed\n\n%s",
			host,
			string(output),
		), duration, err
	}

	return fmt.Sprintf(
		"Ping to %s successful\n\n%s",
		host,
		string(output),
	), duration, nil
}
