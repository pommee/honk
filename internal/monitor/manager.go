package monitor

import (
	"context"
	"fmt"
	"honk/internal"
	"honk/internal/database"
	"sync"
	"time"

	"gorm.io/gorm"
)

var logger = internal.GetLogger()

type Handler interface {
	Check(ctx context.Context, m *database.Monitor) error
}

type Manager struct {
	db       *gorm.DB
	mu       sync.Mutex
	monitors map[string]*database.Monitor
	handlers map[ConnectionType]Handler

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NewManager(db *gorm.DB) *Manager {
	ctx, cancel := context.WithCancel(context.Background())

	mgr := &Manager{
		db:       db,
		monitors: make(map[string]*database.Monitor),
		handlers: make(map[ConnectionType]Handler),
		ctx:      ctx,
		cancel:   cancel,
	}

	mgr.loadMonitorsFromDB()

	return mgr
}

func (m *Manager) loadMonitorsFromDB() {
	var dbMonitors []database.Monitor
	if err := m.db.Find(&dbMonitors).Error; err != nil {
		logger.Error("failed to load monitors from database: %v", err)
		return
	}

	for i := range dbMonitors {
		mon := &dbMonitors[i]
		m.monitors[mon.Name] = mon
		m.startMonitor(mon)
	}

	logger.Info("%d monitors loaded from database", len(dbMonitors))
}

func (m *Manager) RegisterHandler(ct ConnectionType, h Handler) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.handlers[ct] = h
}

func (m *Manager) AddMonitor(mon *database.Monitor) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.monitors[mon.Name]; exists {
		return fmt.Errorf("monitor %q already exists", mon.Name)
	}

	if _, ok := m.handlers[ConnectionType(mon.ConnectionType)]; !ok {
		return fmt.Errorf("no handler for connection type %d", mon.ConnectionType)
	}

	m.db.Create(&mon)

	m.monitors[mon.Name] = mon
	m.startMonitor(mon)

	logger.Info("A new monitor was added!")
	return nil
}

func (m *Manager) GetMonitor(name string) *database.Monitor {
	for _, monitor := range m.monitors {
		if monitor.Name == name {
			return monitor
		}
	}

	return nil
}

func (m *Manager) ListMonitors() map[string]*database.Monitor {
	return m.monitors
}

func (m *Manager) RemoveMonitor(name string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.monitors, name)
}

func (m *Manager) startMonitor(mon *database.Monitor) {
	m.wg.Add(1)

	go func() {
		defer m.wg.Done()

		m.runCheck(mon)

		ticker := time.NewTicker(time.Duration(mon.Interval) * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-m.ctx.Done():
				return
			case <-ticker.C:
				m.runCheck(mon)
			}
		}
	}()
}

func (m *Manager) runCheck(mon *database.Monitor) {
	m.mu.Lock()
	handler := m.handlers[ConnectionType(mon.ConnectionType)]
	m.mu.Unlock()

	if handler == nil {
		return
	}

	err := handler.Check(m.ctx, mon)

	// Update monitor fields in memory
	mon.Checked = time.Now()
	mon.Healthy = err == nil
	if err != nil {
		mon.Err = err.Error()
		m.db.Create(&database.MonitorError{
			Created: time.Now(),
			Err:     mon.Err,
		})
	} else {
		mon.Err = ""
	}

	mon.TotalChecks++
	if mon.Healthy {
		mon.SuccessfulChecks++
	}

	if mon.TotalChecks > 0 {
		mon.Uptime = (float32(mon.SuccessfulChecks) / float32(mon.TotalChecks)) * 100
	}

	if err := m.db.Save(mon).Error; err != nil {
		logger.Error("failed to update monitor in database: %v", err)
	}
}

func (m *Manager) Stop() {
	m.cancel()
	m.wg.Wait()
}
