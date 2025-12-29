package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (api *API) registerStatisticRoutes() {
	api.routes.GET("/info", api.getInfo)
}

func (api *API) getInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"version": api.version,
		"commit":  api.commit,
		"date":    api.date,
	})
}
