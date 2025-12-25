package monitor

import (
	"context"
	"fmt"
	"honk/internal"
	"honk/internal/database"
	"sync"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var logger = internal.GetLogger()

type Handler interface {
	Check(ctx context.Context, m *database.Monitor) (string, int64, error)
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
	handlers map[database.ConnectionType]Handler

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
		handlers: make(map[database.ConnectionType]Handler),
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

func (m *Manager) RegisterHandler(ct database.ConnectionType, h Handler) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.handlers[ct] = h
}

func (m *Manager) AddMonitor(mon *database.Monitor) (*database.Monitor, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.monitors[int(mon.ID)]; exists {
		return nil, fmt.Errorf("monitor %q already exists", mon.Name)
	}

	if _, ok := m.handlers[database.ConnectionType(mon.ConnectionType)]; !ok {
		return nil, fmt.Errorf("no handler for connection type %s", mon.ConnectionType)
	}

	for _, existingMon := range m.monitors {
		if existingMon.Connection == mon.Connection {
			return nil, fmt.Errorf("there is already a monitor for %s", mon.Connection)
		}
	}

	m.db.Create(&mon)

	m.monitors[int(mon.ID)] = mon
	m.startMonitor(int(mon.ID))

	logger.Info("A new monitor was added!")
	return mon, nil
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

	existing.Enabled = mon.Enabled
	existing.Name = mon.Name
	existing.Connection = mon.Connection
	existing.Interval = mon.Interval
	existing.AlwaysSave = mon.AlwaysSave
	existing.ConnectionType = mon.ConnectionType

	m.mu.Unlock()

	err := m.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Notification").Save(existing).Error; err != nil {
			return err
		}

		if mon.Notification.Type != "" || mon.Notification.Webhook != "" {
			notification := database.Notification{
				MonitorID: existing.ID,
				Enabled:   mon.Notification.Enabled,
				Type:      mon.Notification.Type,
				Webhook:   mon.Notification.Webhook,
			}

			result := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "monitor_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"enabled", "type", "webhook"}),
			}).Create(&notification)

			if result.Error != nil {
				return result.Error
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	m.startMonitor(int(existing.ID))

	logger.Info("Monitor '%s' with id %d was updated", existing.Name, existing.ID)
	return nil
}

func (m *Manager) GetMonitor(id int) *database.Monitor {
	var mon database.Monitor
	result := m.db.Preload(clause.Associations).Where("id = ?", id).Find(&mon)

	if result.RowsAffected == 0 {
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
		return fmt.Errorf("monitor with id %d does not exist", id)
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

	if !mon.Enabled {
		mon.Healthy = nil
		if err := m.db.Save(mon).Error; err != nil {
			logger.Error("failed to update disabled monitor: %v", err)
		}
		m.mu.Unlock()
		return
	}

	handler := m.handlers[database.ConnectionType(mon.ConnectionType)]
	m.mu.Unlock()

	if handler == nil {
		return
	}

	var (
		start                       = time.Now()
		response, responseTime, err = handler.Check(ctx, mon)
		result                      = response
	)

	if err != nil {
		if result == "" {
			result = err.Error()
		}
	} else if !mon.AlwaysSave {
		result = ""
	}

	healthy := err == nil
	mon.Checked = start
	mon.Healthy = &healthy
	mon.TotalChecks++
	if healthy {
		mon.SuccessfulChecks++
	}

	check := &database.MonitorCheck{
		MonitorID:      mon.ID,
		Created:        start,
		Success:        healthy,
		Result:         result,
		ResponseTimeMs: responseTime,
	}

	if dbErr := m.db.Create(check).Error; dbErr != nil {
		logger.Error("failed to save monitor check: %v", dbErr)
	}

	if dbErr := m.db.Save(mon).Error; dbErr != nil {
		logger.Error("failed to update monitor: %v", dbErr)
	}
}

func (m *Manager) Stop() {
	m.cancel()
	m.wg.Wait()
}
