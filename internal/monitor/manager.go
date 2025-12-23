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
	Check(ctx context.Context, m *database.Monitor) (string, error)
}

type monitorRunner struct {
	cancel context.CancelFunc
	done   chan struct{}
}

type Manager struct {
	db       *gorm.DB
	mu       sync.Mutex
	monitors map[int]*database.Monitor
	runners  map[int]*monitorRunner
	handlers map[ConnectionType]Handler

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NewManager(db *gorm.DB) *Manager {
	ctx, cancel := context.WithCancel(context.Background())

	mgr := &Manager{
		db:       db,
		monitors: make(map[int]*database.Monitor),
		runners:  make(map[int]*monitorRunner),
		handlers: make(map[ConnectionType]Handler),
		ctx:      ctx,
		cancel:   cancel,
	}

	mgr.loadMonitorsFromDB()

	return mgr
}

func (m *Manager) loadMonitorsFromDB() {
	var dbMonitors []database.Monitor
	if err := m.db.Preload("Checks").Find(&dbMonitors).Error; err != nil {
		logger.Error("failed to load monitors from database: %v", err)
		return
	}

	for i := range dbMonitors {
		mon := &dbMonitors[i]
		m.monitors[int(mon.ID)] = mon
		m.startMonitor(int(mon.ID))
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

	if _, exists := m.monitors[int(mon.ID)]; exists {
		return fmt.Errorf("monitor %q already exists", mon.Name)
	}

	if _, ok := m.handlers[ConnectionType(mon.ConnectionType)]; !ok {
		return fmt.Errorf("no handler for connection type %d", mon.ConnectionType)
	}

	for _, existingMon := range m.monitors {
		if existingMon.Connection == mon.Connection {
			return fmt.Errorf("There is already a monitor for %s", mon.Connection)
		}
	}

	m.db.Create(&mon)

	m.monitors[int(mon.ID)] = mon
	m.startMonitor(int(mon.ID))

	logger.Info("A new monitor was added!")
	return nil
}

func (m *Manager) UpdateMonitor(mon *database.Monitor) error {
	m.mu.Lock()
	existing, exists := m.monitors[int(mon.ID)]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("monitor %d does not exist", mon.ID)
	}

	if runner, exists := m.runners[int(mon.ID)]; exists {
		runner.cancel()
		<-runner.done
		delete(m.runners, int(mon.ID))
	}

	existing.Name = mon.Name
	existing.Connection = mon.Connection
	existing.Interval = mon.Interval
	existing.AlwaysSave = mon.AlwaysSave
	existing.ConnectionType = mon.ConnectionType

	m.mu.Unlock()

	if err := m.db.Save(existing).Error; err != nil {
		return err
	}

	m.startMonitor(int(existing.ID))

	logger.Info("Monitor '%s' updated", existing.Name)
	return nil
}

func (m *Manager) GetMonitor(name string) *database.Monitor {
	var mon database.Monitor
	err := m.db.Preload("Checks").Where("name = ?", name).First(&mon).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		return nil
	}
	return &mon
}

func (m *Manager) ListMonitors() map[int]*database.Monitor {
	return m.monitors
}

func (m *Manager) RemoveMonitor(id int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	mon, exists := m.monitors[id]
	if !exists {
		return fmt.Errorf("Monitor with id %d does not exist", id)
	}

	if runner, exists := m.runners[id]; exists {
		runner.cancel()
		<-runner.done
		delete(m.runners, id)
	}

	delete(m.monitors, id)

	if err := m.db.Delete(mon).Error; err != nil {
		return fmt.Errorf("failed to delete monitor from database: %v", err)
	}

	logger.Info("Monitor %q removed", mon.Name)
	return nil
}

func (m *Manager) startMonitor(monID int) {
	ctx, cancel := context.WithCancel(m.ctx)
	done := make(chan struct{})

	m.runners[monID] = &monitorRunner{
		cancel: cancel,
		done:   done,
	}

	m.wg.Add(1)

	go func() {
		defer m.wg.Done()
		defer close(done)

		m.runCheck(ctx, monID)

		m.mu.Lock()
		mon := m.monitors[monID]
		m.mu.Unlock()

		if mon == nil {
			return
		}

		ticker := time.NewTicker(time.Duration(mon.Interval) * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				m.runCheck(ctx, monID)
			}
		}
	}()
}

func (m *Manager) runCheck(ctx context.Context, monID int) {
	m.mu.Lock()
	mon := m.monitors[monID]
	if mon == nil {
		m.mu.Unlock()
		return
	}
	handler := m.handlers[ConnectionType(mon.ConnectionType)]
	m.mu.Unlock()

	if handler == nil {
		return
	}

	start := time.Now()
	response, err := handler.Check(ctx, mon)

	mon.Checked = start
	mon.Healthy = err == nil
	mon.TotalChecks++
	if mon.Healthy {
		mon.SuccessfulChecks++
	}

	if mon.TotalChecks > 0 {
		mon.Uptime = (float32(mon.SuccessfulChecks) / float32(mon.TotalChecks)) * 100
	}

	check := &database.MonitorCheck{
		MonitorID: mon.ID,
		Created:   start,
		Success:   mon.Healthy,
		Result:    response,
	}

	if err := m.db.Create(check).Error; err != nil {
		logger.Error("failed to save monitor check: %v", err)
	}

	if err := m.db.Save(mon).Error; err != nil {
		logger.Error("failed to update monitor: %v", err)
	}
}

func (m *Manager) Stop() {
	m.cancel()
	m.wg.Wait()
}
