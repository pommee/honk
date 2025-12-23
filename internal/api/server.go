package api

import (
	"embed"
	"fmt"
	"honk/internal"
	"honk/internal/monitor"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var logger = internal.GetLogger()

const (
	maxRetries = 10
)

type API struct {
	WSCommunication *websocket.Conn
	router          *gin.Engine
	routes          *gin.RouterGroup

	Authentication bool
	Dashboard      bool
	Port           int

	Manager *monitor.Manager
	Client  *internal.DockerClient
}

func (api *API) Start(content embed.FS, errorChannel chan struct{}) {
	api.initializeRouter()
	api.configureCORS()
	api.setupRoutes()

	if api.Dashboard {
		api.serveEmbeddedContent(content)
	}

	api.startServer(errorChannel)
}

func (api *API) initializeRouter() {
	gin.SetMode(gin.ReleaseMode)
	api.router = gin.New()

	api.router.Use(gzip.Gzip(gzip.DefaultCompression))
	api.routes = api.router.Group("/api")
}

func (api *API) configureCORS() {
	var (
		corsConfig = cors.Config{
			AllowOrigins:     []string{},
			AllowMethods:     []string{"POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Content-Type", "Authorization", "Cookie"},
			ExposeHeaders:    []string{"Set-Cookie"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}
	)

	if api.Dashboard {
		corsConfig.AllowOrigins = append(corsConfig.AllowOrigins, "*")
	} else {
		logger.Warning("Dashboard UI is disabled")
		corsConfig.AllowOrigins = append(corsConfig.AllowOrigins, "http://localhost:8081")
		api.routes.Use(cors.New(corsConfig))
	}

	api.router.Use(cors.New(corsConfig))
	api.setupAuthAndMiddleware()
}

func (api *API) setupRoutes() {
	api.registerMonitorRoutes()
	api.registerContainerRoutes()
}

func (api *API) setupAuthAndMiddleware() {
	if api.Authentication {
		//api.setupAuth()
		//api.routes.Use(api.authMiddleware())
	} else {
		logger.Warning("Dashboard authentication is disabled.")
	}
}

func (api *API) startServer(errorChannel chan struct{}) {
	var (
		addr     = fmt.Sprintf(":%d", api.Port)
		listener net.Listener
		err      error
	)

	for attempt := 1; attempt <= maxRetries; attempt++ {
		listener, err = net.Listen("tcp", addr)
		if err == nil {
			break
		}

		logger.Error("Failed to bind to port (attempt %d/%d): %v", attempt, maxRetries, err)

		if attempt < maxRetries {
			time.Sleep(1 * time.Second)
		}
	}

	if err != nil {
		logger.Error("Failed to start server after %d attempts", maxRetries)
		errorChannel <- struct{}{}
		return
	}

	if serverIP, err := GetServerIP(); err == nil {
		logger.Info(fmt.Sprintf("Web interface available at http://%s:%d", serverIP, api.Port))
	} else {
		logger.Info("Web server started on port :%d", api.Port)
	}

	if err := api.router.RunListener(listener); err != nil {
		logger.Error("Server error: %v", err)
		errorChannel <- struct{}{}
	}
}

func (api *API) serveEmbeddedContent(content embed.FS) {
	ipAddress, err := GetServerIP()
	if err != nil {
		logger.Error("Error getting IP address: %v", err)
		return
	}

	if err := api.serveStaticFiles(content); err != nil {
		logger.Error("Error serving embedded content: %v", err)
		return
	}

	api.serveIndexHTML(content, ipAddress)
}

func (api *API) serveStaticFiles(content embed.FS) error {
	return fs.WalkDir(content, "client/dist", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return fmt.Errorf("error walking through path %s: %w", path, err)
		}

		if d.IsDir() || path == "client/dist/index.html" {
			return nil
		}

		return api.registerStaticFile(content, path)
	})
}

func (api *API) registerStaticFile(content embed.FS, path string) error {
	fileContent, err := content.ReadFile(path)
	if err != nil {
		return fmt.Errorf("error reading file %s: %w", path, err)
	}

	mimeType := api.getMimeType(path)
	route := strings.TrimPrefix(path, "client/dist/")

	api.router.GET("/"+route, func(c *gin.Context) {
		c.Data(http.StatusOK, mimeType, fileContent)
	})

	return nil
}

func (api *API) getMimeType(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}
	return mimeType
}

func (api *API) serveIndexHTML(content embed.FS, ipAddress string) {
	indexContent, err := content.ReadFile("client/dist/index.html")
	if err != nil {
		logger.Error("Error reading index.html: %v", err)
		return
	}

	indexWithConfig := injectServerConfig(string(indexContent), ipAddress, api.Port)
	handleIndexHTML := func(c *gin.Context) {
		c.Header("Content-Type", "text/html")
		c.Data(http.StatusOK, "text/html", []byte(indexWithConfig))
	}

	api.router.GET("/", handleIndexHTML)
	api.router.NoRoute(handleIndexHTML)
}

func (api *API) error(c *gin.Context, code int, message string) {
	c.JSON(code, gin.H{"error": message})
	return
}

func injectServerConfig(htmlContent, serverIP string, port int) string {
	serverConfigScript := fmt.Sprintf(`<script>
	window.SERVER_CONFIG = {
		ip: "%s",
		port: "%d"
	};
	</script>`, serverIP, port)

	return strings.Replace(
		htmlContent,
		"<head>",
		"<head>\n  "+serverConfigScript,
		1,
	)
}

// GetServerIP retrieves the first non-loopback IPv4 address of the server.
func GetServerIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && !ipnet.IP.IsLinkLocalUnicast() && ipnet.IP.To4() != nil {
			return ipnet.IP.String(), nil
		}
	}

	return "", fmt.Errorf("server IP not found")
}
