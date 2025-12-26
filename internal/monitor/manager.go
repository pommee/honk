package monitor

import (
	"context"
	"fmt"
	"honk/internal/database"
	"honk/internal/notification"
	"maps"
	"sync"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

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
	if err := m.db.Preload(clause.Associations).Find(&dbMonitors).Error; err != nil {
		log.Error("failed to load monitors from database: %v", err)
		return
	}

	for i := range dbMonitors {
		mon := &dbMonitors[i]

		for j := range mon.Checks {
			mon.Checks[j].Result = ""
		}

		m.monitors[int(mon.ID)] = mon
		m.startMonitor(int(mon.ID))
	}

	log.Info("%d monitors loaded from database", len(dbMonitors))
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
		return nil, fmt.Errorf("no handler registered for connection type %s", mon.ConnectionType)
	}

	for _, existing := range m.monitors {
		if existing.Connection == mon.Connection {
			return nil, fmt.Errorf("a monitor already exists for connection %s", mon.Connection)
		}
	}

	if err := m.db.Create(mon).Error; err != nil {
		return nil, fmt.Errorf("failed to save new monitor: %w", err)
	}

	m.monitors[int(mon.ID)] = mon
	m.startMonitor(int(mon.ID))

	log.Info("new monitor added: %s (ID: %d)", mon.Name, mon.ID)
	return mon, nil
}

func (m *Manager) UpdateMonitor(updated *database.Monitor) error {
	m.mu.Lock()
	existing, exists := m.monitors[int(updated.ID)]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("monitor %d does not exist", updated.ID)
	}

	if runner, ok := m.runners[int(updated.ID)]; ok {
		runner.cancel()
		<-runner.done
		delete(m.runners, int(updated.ID))
	}

	existing.Enabled = updated.Enabled
	existing.Name = updated.Name
	existing.Connection = updated.Connection
	existing.Interval = updated.Interval
	existing.AlwaysSave = updated.AlwaysSave
	existing.ConnectionType = updated.ConnectionType
	existing.Timeout = updated.Timeout
	existing.Body = updated.Body
	existing.HTTPMethod = updated.HTTPMethod
	existing.HttpMonitorHeaders = updated.HttpMonitorHeaders

	m.mu.Unlock()

	err := m.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Notification").Save(existing).Error; err != nil {
			return err
		}

		if updated.Notification.Type != "" || updated.Notification.Webhook != "" {
			notification := database.Notification{
				MonitorID: existing.ID,
				Enabled:   updated.Notification.Enabled,
				Type:      updated.Notification.Type,
				Webhook:   updated.Notification.Webhook,
			}

			return tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "monitor_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"enabled", "type", "webhook"}),
			}).Create(&notification).Error
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to update monitor %d: %w", updated.ID, err)
	}

	m.startMonitor(int(existing.ID))

	log.Info("monitor updated: %s (ID: %d)", existing.Name, existing.ID)

	if err := m.db.Preload(clause.Associations).Find(existing).Error; err != nil {
		log.Error("failed to reload associations for monitor %d: %v", existing.ID, err)
	}

	return nil
}

func (m *Manager) GetMonitor(id int) *database.Monitor {
	var mon database.Monitor
	if err := m.db.Preload(clause.Associations).Where("id = ?", id).Find(&mon).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		log.Error("failed to load monitor %d: %v", id, err)
		return nil
	}
	return &mon
}

func (m *Manager) RunMonitor(id int) (*database.Monitor, error) {
	m.mu.Lock()
	mon, exists := m.monitors[id]
	if !exists {
		m.mu.Unlock()
		return nil, fmt.Errorf("monitor %d not found", id)
	}
	if !mon.Enabled {
		m.mu.Unlock()
		return nil, fmt.Errorf("monitor %d is disabled", id)
	}
	m.mu.Unlock()

	m.runCheck(context.Background(), id)

	updated := m.GetMonitor(id)
	if updated == nil {
		return nil, fmt.Errorf("failed to reload monitor %d after manual run", id)
	}

	return updated, nil
}

func (m *Manager) ListMonitors() map[int]*database.Monitor {
	m.mu.Lock()
	defer m.mu.Unlock()

	copy := make(map[int]*database.Monitor, len(m.monitors))
	maps.Copy(copy, m.monitors)
	return copy
}

func (m *Manager) RemoveMonitor(id int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	mon, exists := m.monitors[id]
	if !exists {
		return fmt.Errorf("monitor %d does not exist", id)
	}

	if runner, ok := m.runners[id]; ok {
		runner.cancel()
		<-runner.done
		delete(m.runners, id)
	}

	delete(m.monitors, id)

	if err := m.db.Delete(mon).Error; err != nil {
		return fmt.Errorf("failed to delete monitor %d from database: %w", id, err)
	}

	log.Info("monitor removed: %s (ID: %d)", mon.Name, id)
	return nil
}

func (m *Manager) startMonitor(monID int) {
	ctx, cancel := context.WithCancel(m.ctx)
	done := make(chan struct{})

	m.mu.Lock()
	m.runners[monID] = &monitorRunner{cancel: cancel, done: done}
	m.mu.Unlock()

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
			log.Error("failed to update disabled monitor %d: %v", mon.ID, err)
		}
		m.mu.Unlock()
		return
	}

	wasUnhealthy := mon.Healthy != nil && !*mon.Healthy
	handler, handlerExists := m.handlers[database.ConnectionType(mon.ConnectionType)]
	m.mu.Unlock()

	if !handlerExists {
		log.Error("no handler for connection type %s (monitor %d)", mon.ConnectionType, mon.ID)
		return
	}

	start := time.Now()
	response, responseTime, err := handler.Check(ctx, mon)
	result := response
	healthy := err == nil

	if err != nil && result == "" {
		result = err.Error()
	} else if healthy && !mon.AlwaysSave {
		result = ""
	}

	if err != nil && mon.Notification.Enabled {
		notifier := notification.NewWebhookNotifier(mon.Notification.Webhook)
		notifier.Send(notification.Message{
			Title: fmt.Sprintf("Issues with %s", mon.Name),
			Text:  fmt.Sprintf("The goose has encountered an issue while contacting %s\n\n```\n%s\n```", mon.Connection, result),
			Level: notification.Error,
		})
	}

	if wasUnhealthy && healthy && mon.Notification.Enabled {
		notifier := notification.NewWebhookNotifier(mon.Notification.Webhook)
		notifier.Send(notification.Message{
			Title: fmt.Sprintf("%s is back up", mon.Name),
			Text:  fmt.Sprintf("Good news! The monitor **%s** has recovered and is now responding normally.\n\nConnection: %s", mon.Name, mon.Connection),
			Level: notification.Success,
		})
	}

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

	if err := m.db.Create(check).Error; err != nil {
		log.Error("failed to save check for monitor %d: %v", mon.ID, err)
	}

	if err := m.db.Save(mon).Error; err != nil {
		log.Error("failed to update monitor %d after check: %v", mon.ID, err)
	}
}

func (m *Manager) Stop() {
	m.cancel()
	m.wg.Wait()
}
