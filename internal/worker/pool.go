package worker

import (
	"context"
	"log"
	"sync"
	"sync/atomic"
	"time"
)

// Job represents a unit of work to be executed by a worker
type Job struct {
	ID      string
	Execute func(ctx context.Context) error
	OnDone  func(err error)
}

// Pool is a bounded worker pool with graceful shutdown support
type Pool struct {
	name       string
	workers    int
	queue      chan Job
	ctx        context.Context
	cancel     context.CancelFunc
	wg         sync.WaitGroup
	processed  atomic.Int64
	failed     atomic.Int64
	maxRetries int
}

// NewPool creates and starts a worker pool.
// workers: number of concurrent goroutines
// queueSize: max pending jobs before Submit blocks
func NewPool(name string, workers, queueSize, maxRetries int) *Pool {
	ctx, cancel := context.WithCancel(context.Background())
	p := &Pool{
		name:       name,
		workers:    workers,
		queue:      make(chan Job, queueSize),
		ctx:        ctx,
		cancel:     cancel,
		maxRetries: maxRetries,
	}
	p.start()
	return p
}

func (p *Pool) start() {
	for i := 0; i < p.workers; i++ {
		p.wg.Add(1)
		go p.work(i)
	}
	log.Printf("[worker:%s] started %d workers (queue=%d)", p.name, p.workers, cap(p.queue))
}

func (p *Pool) work(id int) {
	defer p.wg.Done()
	for {
		select {
		case <-p.ctx.Done():
			return
		case job, ok := <-p.queue:
			if !ok {
				return
			}
			p.runWithRetry(job)
		}
	}
}

func (p *Pool) runWithRetry(job Job) {
	var err error
	for attempt := 0; attempt <= p.maxRetries; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(attempt*attempt) * 500 * time.Millisecond
			log.Printf("[worker:%s] job %s retry %d after %v", p.name, job.ID, attempt, backoff)
			select {
			case <-p.ctx.Done():
				return
			case <-time.After(backoff):
			}
		}

		err = job.Execute(p.ctx)
		if err == nil {
			break
		}
		log.Printf("[worker:%s] job %s attempt %d failed: %v", p.name, job.ID, attempt+1, err)
	}

	if err != nil {
		p.failed.Add(1)
	} else {
		p.processed.Add(1)
	}

	if job.OnDone != nil {
		job.OnDone(err)
	}
}

// Submit enqueues a job. Returns false if the pool is shutting down.
func (p *Pool) Submit(job Job) bool {
	select {
	case <-p.ctx.Done():
		return false
	case p.queue <- job:
		return true
	}
}

// SubmitNonBlocking tries to enqueue but doesn't wait. Returns false if queue is full.
func (p *Pool) SubmitNonBlocking(job Job) bool {
	select {
	case p.queue <- job:
		return true
	default:
		log.Printf("[worker:%s] queue full, dropped job %s", p.name, job.ID)
		return false
	}
}

// Shutdown gracefully drains and stops the pool
func (p *Pool) Shutdown(timeout time.Duration) {
	log.Printf("[worker:%s] shutting down...", p.name)
	p.cancel()

	done := make(chan struct{})
	go func() {
		p.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		log.Printf("[worker:%s] clean shutdown (processed=%d, failed=%d)",
			p.name, p.processed.Load(), p.failed.Load())
	case <-time.After(timeout):
		log.Printf("[worker:%s] shutdown timed out after %v", p.name, timeout)
	}
}

// Stats returns processing counters
func (p *Pool) Stats() (processed, failed int64) {
	return p.processed.Load(), p.failed.Load()
}
