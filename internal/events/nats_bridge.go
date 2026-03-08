package events

import (
	"encoding/json"
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

// NATSBridgeImpl bridges the in-process Bus to a NATS server.
// It re-publishes outbound events and subscribes to incoming ones
// so multiple server instances stay in sync.
type NATSBridgeImpl struct {
	conn        *nats.Conn
	bus         *Bus
	subs        []*nats.Subscription
}

// NewNATSBridge connects to the given NATS URL and wires up the bridge.
// Returns (nil, nil) if natsURL is empty — allows the app to run without NATS.
func NewNATSBridge(natsURL string, bus *Bus) (*NATSBridgeImpl, error) {
	if natsURL == "" {
		log.Println("[nats] NATS_URL not set — running in single-instance mode (no NATS)")
		return nil, nil
	}

	opts := nats.Options{
		Url:            natsURL,
		MaxReconnect:   -1, // reconnect forever
		ReconnectWait:  2 * time.Second,
		PingInterval:   20 * time.Second,
		MaxPingsOut:    3,
		ReconnectedCB:  func(nc *nats.Conn) { log.Printf("[nats] reconnected to %s", nc.ConnectedUrl()) },
		DisconnectedErrCB: func(nc *nats.Conn, err error) {
			if err != nil {
				log.Printf("[nats] disconnected: %v", err)
			}
		},
		ClosedCB: func(nc *nats.Conn) { log.Println("[nats] connection closed") },
	}

	conn, err := opts.Connect()
	if err != nil {
		return nil, err
	}

	bridge := &NATSBridgeImpl{conn: conn, bus: bus}
	bus.SetNATSBridge(bridge)

	// Subscribe to all afst.* subjects so events from other instances
	// are re-injected into the local in-process bus
	sub, err := conn.Subscribe("afst.>", func(msg *nats.Msg) {
		var event Event
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			log.Printf("[nats] unmarshal error: %v", err)
			return
		}
		// Re-publish locally (without going back to NATS to avoid loops)
		// We temporarily remove the bridge during re-injection
		bus.publishLocal(event)
	})
	if err != nil {
		conn.Close()
		return nil, err
	}
	bridge.subs = append(bridge.subs, sub)

	log.Printf("[nats] connected to %s — distributed event mode active", natsURL)
	return bridge, nil
}

// Publish sends an event to NATS (called by the Bus)
func (b *NATSBridgeImpl) Publish(subject string, data []byte) error {
	return b.conn.Publish(subject, data)
}

// Subscribe registers a NATS subject handler (used for NATS → local bridge above)
func (b *NATSBridgeImpl) Subscribe(subject string, handler func([]byte)) error {
	sub, err := b.conn.Subscribe(subject, func(msg *nats.Msg) {
		handler(msg.Data)
	})
	if err != nil {
		return err
	}
	b.subs = append(b.subs, sub)
	return nil
}

// Close drains and shuts down the NATS connection
func (b *NATSBridgeImpl) Close() {
	for _, sub := range b.subs {
		_ = sub.Unsubscribe()
	}
	b.conn.Drain()
}

// publishLocal injects an event into the local bus without bridging back to NATS
func (b *Bus) publishLocal(event Event) {
	b.mu.RLock()
	subs := b.subscribers[event.Type]
	snapshot := make([]Subscriber, len(subs))
	copy(snapshot, subs)
	b.mu.RUnlock()

	for _, ch := range snapshot {
		select {
		case ch <- event:
		default:
			// drop
		}
	}
}
