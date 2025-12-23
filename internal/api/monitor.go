package api

import (
	"fmt"
	"net/http"

	"honk/internal/database"

	"github.com/gin-gonic/gin"
)

func (api *API) registerMonitorRoutes() {
	api.routes.POST("/monitor", api.createMonitor)

	api.routes.GET("/monitors", api.listMonitors)
	api.routes.GET("/monitor/:name", api.getMonitor)

	api.routes.DELETE("/monitor/:name", api.deleteMonitor)
}

func (api *API) createMonitor(c *gin.Context) {
	var req NewMonitor
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warning("Invalid monitor payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	err := api.Manager.AddMonitor(&database.Monitor{
		Name:           req.Name,
		ConnectionType: req.ConnectionType,
		Connection:     req.Connection,
		Interval:       req.Interval,
		AlwaysSave:     *req.AlwaysSave,
	})
	if err != nil {
		logger.Warning("Failed to add monitor: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("%v", err),
		})
		return
	}

	c.Status(http.StatusOK)
}

func (api *API) getMonitor(c *gin.Context) {
	name := c.Param("name")

	monitor := api.Manager.GetMonitor(name)
	if monitor == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "monitor not found",
		})
		return
	}

	c.JSON(http.StatusOK, monitor)
}

func (api *API) listMonitors(c *gin.Context) {
	c.JSON(http.StatusOK, api.Manager.ListMonitors())
}

func (api *API) deleteMonitor(c *gin.Context) {
	name := c.Param("name")

	api.Manager.RemoveMonitor(name)
	c.Status(http.StatusOK)
}
