package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/oneErrortime/afst/internal/events"
)

// SSEHandler streams server-sent events to connected frontend clients.
// Each user gets their own subscription filtered by user_id.
type SSEHandler struct {
	bus *events.Bus
}

func NewSSEHandler(bus *events.Bus) *SSEHandler {
	return &SSEHandler{bus: bus}
}

// Stream handles GET /api/v1/events/stream
// The client gets SSE for events relevant to their user_id.
//
//	@Summary	Subscribe to real-time events
//	@Tags		events
//	@Produce	text/event-stream
//	@Security	BearerAuth
//	@Success	200
//	@Router		/events/stream [get]
func (h *SSEHandler) Stream(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID, _ := userIDVal.(string)

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // disable nginx buffering

	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	// Subscribe to all interesting event types
	sub := h.bus.Subscribe(ctx,
		events.EventBookUploaded,
		events.EventBookProcessed,
		events.EventAccessGranted,
		events.EventAccessRevoked,
		events.EventSubscriptionNew,
		events.EventSubscriptionExpired,
		events.EventReadingProgress,
	)

	// Send initial "connected" event
	writeSSE(c, "connected", map[string]string{
		"status":  "connected",
		"user_id": userID,
	})

	// Heartbeat ticker — keeps the connection alive through proxies
	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	c.Stream(func(w http.ResponseWriter) bool {
		select {
		case <-ctx.Done():
			return false

		case <-ticker.C:
			writeSSE(c, "ping", map[string]string{"t": time.Now().Format(time.RFC3339)})
			return true

		case event, ok := <-sub:
			if !ok {
				return false
			}

			// Filter: only send to the relevant user
			if event.UserID != "" && event.UserID != userID {
				return true // skip but stay connected
			}

			writeSSE(c, string(event.Type), event.Payload)
			return true
		}
	})
}

func writeSSE(c *gin.Context, eventType string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", eventType, data)
}
