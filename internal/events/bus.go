package events

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"
)

// EventType defines all system event types
type EventType string

const (
	EventBookUploaded      EventType = "book.uploaded"
	EventBookProcessed     EventType = "book.processed"
	EventBookDeleted       EventType = "book.deleted"
	EventAccessGranted     EventType = "access.granted"
	EventAccessRevoked     EventType = "access.revoked"
	EventSubscriptionNew   EventType = "subscription.new"
	EventSubscriptionExpired EventType = "subscription.expired"
	EventReadingProgress   EventType = "reading.progress"
	EventReadingSessionEnd EventType = "reading.session.end"
)

// Event is the envelope for all system events
type Event struct {
	Type      EventType   `json:"type"`
	Payload   interface{} `json:"payload"`
	UserID    string      `json:"user_id,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// BookUploadedPayload is sent when a file is uploaded for a book
type BookUploadedPayload struct {
	BookID   string `json:"book_id"`
	FileID   string `json:"file_id"`
	FilePath string `json:"file_path"`
	FileType string `json:"file_type"`
}

// BookProcessedPayload is sent after background processing completes
type BookProcessedPayload struct {
	BookID    string `json:"book_id"`
	FileID    string `json:"file_id"`
	PageCount int    `json:"page_count"`
	Success   bool   `json:"success"`
	Error     string `json:"error,omitempty"`
}

// ProgressPayload carries reading progress updates
type ProgressPayload struct {
	BookID      string  `json:"book_id"`
	AccessID    string  `json:"access_id"`
	CurrentPage int     `json:"current_page"`
	TotalPages  int     `json:"total_pages"`
	Progress    float32 `json:"progress"`
}

// Subscriber is a channel that receives events
type Subscriber chan Event

// Bus is the central event dispatcher. It uses in-process channels
// and optionally bridges to NATS for distributed deployments.
type Bus struct {
	mu          sync.RWMutex
	subscribers map[EventType][]Subscriber
	bufferSize  int

	// NATS bridge (optional — nil if NATS not configured)
	natsBridge NATSBridge
}

// NATSBridge abstracts the NATS connection so the bus doesn't import nats directly
type NATSBridge interface {
	Publish(subject string, data []byte) error
	Subscribe(subject string, handler func([]byte)) error
	Close()
}

var defaultBus = NewBus(256)

// Default returns the process-wide event bus
func Default() *Bus {
	return defaultBus
}

// NewBus creates a new event bus with the given subscriber channel buffer size
func NewBus(bufferSize int) *Bus {
	return &Bus{
		subscribers: make(map[EventType][]Subscriber),
		bufferSize:  bufferSize,
	}
}

// SetNATSBridge wires in an optional NATS bridge for multi-instance deployments
func (b *Bus) SetNATSBridge(bridge NATSBridge) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.natsBridge = bridge
}

// Subscribe returns a channel that will receive all events of the given type.
// Cancel ctx to unsubscribe and free resources.
func (b *Bus) Subscribe(ctx context.Context, eventTypes ...EventType) Subscriber {
	ch := make(Subscriber, b.bufferSize)
	b.mu.Lock()
	for _, et := range eventTypes {
		b.subscribers[et] = append(b.subscribers[et], ch)
	}
	b.mu.Unlock()

	go func() {
		<-ctx.Done()
		b.mu.Lock()
		for _, et := range eventTypes {
			subs := b.subscribers[et]
			for i, s := range subs {
				if s == ch {
					b.subscribers[et] = append(subs[:i], subs[i+1:]...)
					break
				}
			}
		}
		b.mu.Unlock()
		close(ch)
	}()
	return ch
}

// Publish dispatches an event to all subscribers and (if configured) NATS
func (b *Bus) Publish(event Event) {
	event.Timestamp = time.Now()

	b.mu.RLock()
	subs := b.subscribers[event.Type]
	// make a copy to avoid holding the lock while sending
	snapshot := make([]Subscriber, len(subs))
	copy(snapshot, subs)
	b.mu.RUnlock()

	for _, ch := range snapshot {
		select {
		case ch <- event:
		default:
			// Subscriber is slow — drop rather than block the publisher
			log.Printf("[events] dropped event %s: subscriber buffer full", event.Type)
		}
	}

	// Bridge to NATS if available
	if b.natsBridge != nil {
		if data, err := json.Marshal(event); err == nil {
			if err := b.natsBridge.Publish("afst."+string(event.Type), data); err != nil {
				log.Printf("[events] NATS publish error for %s: %v", event.Type, err)
			}
		}
	}
}
