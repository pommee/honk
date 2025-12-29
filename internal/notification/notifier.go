package notification

import (
	"bytes"
	"text/template"
	"time"
)

type MessageTemplate struct {
	Title string
	Body  string
}

type TemplateData struct {
	Name       string
	Timestamp  string
	Connection string
	Error      string
	Level      string

	Custom map[string]interface{}
}

type Message struct {
	Title     string
	Text      string
	Level     Level
	Timestamp time.Time
	Data      map[string]interface{}

	Template     *MessageTemplate
	TemplateData *TemplateData
}

func (m *Message) RenderTemplate() error {
	if m.Template == nil || m.TemplateData == nil {
		return nil
	}

	if m.Template.Title != "" {
		titleTmpl, err := template.New("title").Parse(m.Template.Title)
		if err != nil {
			return err
		}
		var titleBuf bytes.Buffer
		if err := titleTmpl.Execute(&titleBuf, m.TemplateData); err != nil {
			return err
		}
		m.Title = titleBuf.String()
	}

	if m.Template.Body != "" {
		bodyTmpl, err := template.New("body").Parse(m.Template.Body)
		if err != nil {
			return err
		}
		var bodyBuf bytes.Buffer
		if err := bodyTmpl.Execute(&bodyBuf, m.TemplateData); err != nil {
			return err
		}
		m.Text = bodyBuf.String()
	}

	return nil
}

type Notifier interface {
	Send(msg Message) error
	SendInfo(title, text string) error
	SendError(title, text string) error
	SendWarning(title, text string) error
}

type PayloadBuilder interface {
	Build(msg Message) ([]byte, error)
}
