package notification

import (
	"fmt"
	"net/smtp"
	"time"
)

type EmailNotifier struct {
	SMTPHost string
	SMTPPort string
	Username string
	Password string
	From     string
	To       []string
}

func NewEmailNotifier(smtpHost, smtpPort, username, password, from string, to []string) *EmailNotifier {
	return &EmailNotifier{
		SMTPHost: smtpHost,
		SMTPPort: smtpPort,
		Username: username,
		Password: password,
		From:     from,
		To:       to,
	}
}

func (e *EmailNotifier) Send(msg Message) error {
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}

	subject := msg.Title
	if msg.Level != "" {
		subject = fmt.Sprintf("[%s] %s", msg.Level, msg.Title)
	}

	body := fmt.Sprintf("Time: %s\n\n%s\n", msg.Timestamp.Format(time.RFC1123), msg.Text)

	if len(msg.Data) > 0 {
		body += "\nAdditional Data:\n"
		for k, v := range msg.Data {
			body += fmt.Sprintf("  %s: %v\n", k, v)
		}
	}

	message := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
		e.From,
		e.To[0],
		subject,
		body,
	)

	auth := smtp.PlainAuth("", e.Username, e.Password, e.SMTPHost)
	addr := fmt.Sprintf("%s:%s", e.SMTPHost, e.SMTPPort)

	err := smtp.SendMail(addr, auth, e.From, e.To, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (e *EmailNotifier) SendInfo(title, text string) error {
	return e.Send(Message{Title: title, Text: text, Level: "info"})
}

func (e *EmailNotifier) SendError(title, text string) error {
	return e.Send(Message{Title: title, Text: text, Level: "error"})
}

func (e *EmailNotifier) SendWarning(title, text string) error {
	return e.Send(Message{Title: title, Text: text, Level: "warning"})
}
