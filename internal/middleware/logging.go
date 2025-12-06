package middleware

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"
)

// APIRouteMismatchLogger checks for common API routes that are missing the /api/v1 prefix
// and logs a warning to help diagnose client-side routing issues.
func APIRouteMismatchLogger() gin.HandlerFunc {
	// List of common root paths that should be under /api/v1
	commonMistakeRoutes := []string{
		"/auth",
		"/books",
		"/readers",
		"/borrow",
		"/categories",
		"/setup",
	}

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// Only check for 404s to avoid logging on successful requests
		c.Next()

		if c.Writer.Status() == 404 {
			for _, route := range commonMistakeRoutes {
				if strings.HasPrefix(path, route) {
					log.Printf(
						"[WARNING] Request to [%s] returned 404. Client may be missing the /api/v1 prefix.",
						path,
					)
					// Once we've logged for a matching prefix, we can stop.
					return
				}
			}
		}
	}
}
