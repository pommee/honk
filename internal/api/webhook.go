package api

import (
	"net/http"
	"time"

	"honk/internal/database"
	"honk/internal/notification"

	"github.com/gin-gonic/gin"
)

func (api *API) registerWebhookRoutes() {
	api.routes.POST("/webhook/test", api.testWebhook)
}

func (api *API) testWebhook(c *gin.Context) {
	testType := c.DefaultQuery("type", "error")
	now := time.Now()

	var req database.Notification
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Warning("Invalid monitor payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	var (
		notifier = notification.NewWebhookNotifier(req.Webhook)
		title    = req.Template.ErrorTitle
		body     = req.ErrorBody
	)

	if testType == "success" {
		title = req.Template.SuccessTitle
		body = req.SuccessBody
	}

	msg := notification.Message{
		Level:     notification.Level(testType),
		Timestamp: now,
		Template: &notification.MessageTemplate{
			Title: title,
			Body:  body,
		},
		TemplateData: &notification.TemplateData{
			Name:       "Test service",
			Timestamp:  now.Format(time.RFC3339),
			Connection: "http://localhost:8080/",
			Error:      "Something went wrong",
			Level:      testType,
		},
	}

	notifier.Send(msg)
	c.Status(http.StatusOK)
}
