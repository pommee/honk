package internal

import (
	"context"
	"errors"
	"io"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type DockerClient struct {
	*client.Client
}

func NewClient() *DockerClient {
	c, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		panic(err)
	}

	return &DockerClient{Client: c}
}

func (c *DockerClient) Containers() []container.Summary {
	containers, err := c.ContainerList(context.Background(), container.ListOptions{
		Size: true,
		All:  true,
	})
	if err != nil {
		panic(err)
	}

	return containers
}

func (c *DockerClient) RestartContainer(containerID string) error {
	err := c.ContainerRestart(context.Background(), containerID, container.StopOptions{})
	if err != nil {
		return err
	}

	return nil
}

func (c *DockerClient) PauseContainer(containerID string) error {
	err := c.ContainerPause(context.Background(), containerID)
	if err != nil {
		return err
	}

	return nil
}

func (c *DockerClient) UnpauseContainer(containerID string) error {
	err := c.ContainerUnpause(context.Background(), containerID)
	if err != nil {
		return err
	}

	return nil
}

func (c *DockerClient) StartContainer(containerID string) error {
	err := c.ContainerStart(context.Background(), containerID, container.StartOptions{})
	if err != nil {
		return err
	}

	return nil
}

func (c *DockerClient) StopContainer(containerID string) error {
	err := c.ContainerStop(context.Background(), containerID, container.StopOptions{})
	if err != nil {
		return err
	}

	return nil
}

func (c *DockerClient) DestroyContainer(containerID string) error {
	err := c.ContainerRemove(context.Background(), containerID, container.RemoveOptions{Force: true})
	if err != nil {
		return err
	}

	return nil
}

func (c *DockerClient) GetContainer(containerID string) (container.InspectResponse, error) {
	response, err := c.ContainerInspect(context.Background(), containerID)
	if err != nil {
		return container.InspectResponse{}, err
	}

	return response, nil
}

func (c *DockerClient) StreamLogs(ctx context.Context, containerID string, onLog func(string)) error {
	reader, err := c.ContainerLogs(ctx, containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Tail:       "500",
		Timestamps: false,
	})
	if err != nil {
		return err
	}
	defer reader.Close()

	buf := make([]byte, 8)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			// Read the 8-byte header
			_, err := io.ReadFull(reader, buf)
			if err != nil {
				if errors.Is(err, io.EOF) {
					return nil
				}
				return err
			}

			// The size is in bytes 4-7 (big endian)
			size := uint32(buf[7]) | uint32(buf[6])<<8 | uint32(buf[5])<<16 | uint32(buf[4])<<24

			logLine := make([]byte, size)
			_, err = io.ReadFull(reader, logLine)
			if err != nil {
				if errors.Is(err, io.EOF) {
					return nil
				}
				return err
			}

			onLog(string(logLine))
		}
	}
}
