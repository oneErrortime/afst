package events

import "log"

// NATSBridgeImpl is a no-op stub.
// NATS support is intentionally excluded from this build to keep the
// binary dependency-free. If distributed SSE fanout is needed in the
// future, re-introduce github.com/nats-io/nats.go with `go get` and
// run `go mod tidy` before uncommitting this file.
type NATSBridgeImpl struct{}

// NewNATSBridge returns nil when NATS_URL is empty (single-instance mode).
// It logs a warning when NATS_URL is set so operators know it is ignored.
func NewNATSBridge(natsURL string, bus *Bus) (*NATSBridgeImpl, error) {
	if natsURL == "" {
		log.Println("[nats] NATS_URL not set — running in single-instance mode (no NATS)")
		return nil, nil
	}
	log.Println("[nats] WARNING: NATS_URL is set but NATS support is not compiled in this build")
	return nil, nil
}

// Publish is a no-op in the stub.
func (b *NATSBridgeImpl) Publish(_ string, _ []byte) error { return nil }

// Subscribe is a no-op in the stub.
func (b *NATSBridgeImpl) Subscribe(_ string, _ func([]byte)) error { return nil }

// Close is a no-op in the stub.
func (b *NATSBridgeImpl) Close() {}

// publishLocal would inject an event into the local bus without bridging back to NATS.
// Reserved for future use when real NATS support is added.
// nolint:unused
