package api

import (
	"fmt"
	"net/http"
	"strconv"

	"honk/internal/database"

	"github.com/gin-gonic/gin"
)

func (api *API) registerMonitorRoutes() {
	api.routes.POST("/monitor", api.createMonitor)
	api.routes.POST("/monitor/:id/run", api.runMonitor)

	api.routes.GET("/monitors", api.listMonitors)
	api.routes.GET("/monitor/:id", api.getMonitor)

	api.routes.PUT("/monitor/:id", api.updateMonitor)

	api.routes.DELETE("/monitor/:id", api.deleteMonitor)
}

func (api *API) createMonitor(c *gin.Context) {
	var req NewMonitor
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Warning("Invalid monitor payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	monitor := &database.Monitor{
		Enabled:            *req.Enabled,
		Name:               req.Name,
		ConnectionType:     req.ConnectionType,
		HTTPMethod:         req.HTTPMethod,
		Connection:         req.Connection,
		Interval:           req.Interval,
		AlwaysSave:         *req.AlwaysSave,
		Notification:       req.Notification,
		HttpMonitorHeaders: req.HttpMonitorHeaders,
	}

	newMonitor, err := api.Manager.AddMonitor(monitor)
	if err != nil {
		log.Warning("Failed to add monitor: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err,
		})
		return
	}

	c.JSON(http.StatusOK, newMonitor)
}

func (api *API) runMonitor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monitor id"})
		return
	}

	newMonitor, err := api.Manager.RunMonitor(id)
	if err != nil {
		log.Warning("Failed to add monitor: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err,
		})
		return
	}

	c.JSON(http.StatusOK, newMonitor)
}

func (api *API) getMonitor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monitor id"})
		return
	}

	monitor := api.Manager.GetMonitor(id)
	if monitor == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": fmt.Sprintf("monitor with id '%d' not found", id),
		})
		return
	}

	c.JSON(http.StatusOK, monitor)
}

func (api *API) updateMonitor(c *gin.Context) {
	var req UpdateMonitor
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Warning("Invalid monitor payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	err := api.Manager.UpdateMonitor(&database.Monitor{
		ID:                 uint(req.ID),
		Enabled:            *req.Enabled,
		Name:               req.Name,
		ConnectionType:     req.ConnectionType,
		Connection:         req.Connection,
		Interval:           req.Interval,
		AlwaysSave:         *req.AlwaysSave,
		Notification:       req.Notification,
		HttpMonitorHeaders: req.HttpMonitorHeaders,
	})
	if err != nil {
		log.Warning("Failed to update monitor: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("%v", err),
		})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) listMonitors(c *gin.Context) {
	c.JSON(http.StatusOK, api.Manager.ListMonitors())
}

func (api *API) deleteMonitor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monitor id"})
		return
	}

	err = api.Manager.RemoveMonitor(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("%v", err),
		})
		return
	}
	c.Status(http.StatusOK)
}
