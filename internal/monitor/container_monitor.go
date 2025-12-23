package monitor

import (
	"context"
	"fmt"
	"honk/internal/database"

	"github.com/docker/docker/client"
)

type ContainerHandler struct {
	cli *client.Client
}

func NewContainerHandler() (*ContainerHandler, error) {
	cli, err := client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)
	if err != nil {
		return nil, err
	}

	return &ContainerHandler{cli: cli}, nil
}

func (h *ContainerHandler) Check(ctx context.Context, m *database.Monitor) (string, error) {
	inspect, err := h.cli.ContainerInspect(ctx, m.Connection)
	if err != nil {
		return "", err
	}

	if !inspect.State.Running {
		return "", fmt.Errorf("container %s not running", m.Connection)
	}

	return "", nil
}
