package api

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func (api *API) registerContainerRoutes() {
	api.router.GET("/api/containers", api.listContainers)
	api.router.GET("/api/container/:id", api.getContainer)
	api.router.GET("/api/container/:id/logs", api.getLog)
	api.router.GET("/api/container/:id/terminal", api.getTerminal)

	api.router.POST("/api/container/:id/restart", api.restartContainer)
	api.router.POST("/api/container/:id/pause", api.pauseContainer)
	api.router.POST("/api/container/:id/unpause", api.unpauseContainer)
	api.router.POST("/api/container/:id/start", api.startContainer)
	api.router.POST("/api/container/:id/stop", api.stopContainer)
	api.router.POST("/api/container/:id/destroy", api.destroyContainer)
}

func (api *API) listContainers(c *gin.Context) {
	c.JSON(http.StatusOK, api.Client.Containers())
}

func (api *API) getContainer(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID is required"})
		return
	}

	container, err := api.Client.GetContainer(containerID)
	if err != nil {
		slog.Error("Failed to get container details", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get container details"})
		return
	}

	c.JSON(http.StatusOK, container)
}

func (api *API) restartContainer(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID is required"})
		return
	}

	err := api.Client.RestartContainer(containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restart container"})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) pauseContainer(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID is required"})
		return
	}

	err := api.Client.PauseContainer(containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to pause container"})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) unpauseContainer(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID is required"})
		return
	}

	err := api.Client.UnpauseContainer(containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unpause container"})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) startContainer(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID is required"})
		return
	}

	err := api.Client.StartContainer(containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container"})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) stopContainer(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID is required"})
		return
	}

	err := api.Client.StopContainer(containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop container"})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) destroyContainer(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID is required"})
		return
	}

	err := api.Client.DestroyContainer(containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to destroy container"})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) getLog(c *gin.Context) {
	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(_ *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	api.WSCommunication = conn

	go func() {
		defer func() {
			_ = conn.Close()
			api.WSCommunication = nil
		}()

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		if err := api.Client.StreamLogs(ctx, c.Param("id"), api.WSCom); err != nil {
			slog.Error("Failed to stream logs", "error", err)
		}
	}()
}

func (api *API) getTerminal(c *gin.Context) {
	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(_ *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	defer func() {
		_ = conn.Close()
	}()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create exec instance for interactive shell
	execConfig := container.ExecOptions{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
		Cmd:          []string{"/bin/sh"},
	}

	execID, err := api.Client.ContainerExecCreate(ctx, c.Param("id"), execConfig)
	if err != nil {
		slog.Error("Failed to create exec", "error", err)
		return
	}

	// Attach to the exec instance
	hijackedResp, err := api.Client.ContainerExecAttach(ctx, execID.ID, container.ExecAttachOptions{
		Tty: true,
	})
	if err != nil {
		slog.Error("Failed to attach to exec", "error", err)
		return
	}
	defer hijackedResp.Close()

	// Start the exec instance
	if err := api.Client.ContainerExecStart(ctx, execID.ID, container.ExecStartOptions{
		Tty: true,
	}); err != nil {
		slog.Error("Failed to start exec", "error", err)
		return
	}

	// Handle bidirectional communication
	errChan := make(chan error, 2)

	// Read from container and write to WebSocket
	go func() {
		buffer := make([]byte, 4096)
		for {
			n, err := hijackedResp.Reader.Read(buffer)
			if err != nil {
				if err != io.EOF {
					errChan <- fmt.Errorf("error reading from container: %w", err)
				}
				return
			}
			if n > 0 {
				if err := conn.WriteMessage(websocket.TextMessage, buffer[:n]); err != nil {
					errChan <- fmt.Errorf("error writing to websocket: %w", err)
					return
				}
			}
		}
	}()

	// Read from WebSocket and write to container
	go func() {
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					errChan <- fmt.Errorf("websocket error: %w", err)
				}
				return
			}
			if _, err := hijackedResp.Conn.Write(message); err != nil {
				errChan <- fmt.Errorf("error writing to container: %w", err)
				return
			}
		}
	}()

	// Wait for error or context cancellation
	select {
	case err := <-errChan:
		if err != nil {
			slog.Error("Terminal communication error", "error", err)
		}
	case <-ctx.Done():
		slog.Info("Terminal context cancelled")
	}
}

func (api *API) WSCom(message string) {
	if api.WSCommunication == nil {
		return
	}

	if err := api.WSCommunication.SetWriteDeadline(time.Now().Add(5 * time.Second)); err != nil {
		fmt.Printf("Failed to set websocket write deadline: %v\n", err)
		return
	}

	if err := api.WSCommunication.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
		fmt.Printf("Failed to write websocket message: %v\n", err)
		api.WSCommunication = nil
	}
}
