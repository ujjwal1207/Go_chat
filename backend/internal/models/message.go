package models

import "time"

// Message is a persisted chat message.
// For DMs: RecipientID is set and GroupID is empty.
// For Group messages: GroupID is set and RecipientID is empty.
type Message struct {
	ID          string `bson:"_id,omitempty"      json:"id"`
	SenderID    string `bson:"sender_id"          json:"sender_id"`                  // user ID (hex)
	RecipientID string `bson:"recipient_id,omitempty" json:"recipient_id,omitempty"` // DM target (hex)
	GroupID     string `bson:"group_id,omitempty" json:"group_id,omitempty"`         // group ID (hex)
	Content     string `bson:"content"            json:"content"`
	// Reply metadata (optional)
	ReplyTo     string    `bson:"reply_to,omitempty" json:"reply_to,omitempty"`
	ReplyText   string    `bson:"reply_text,omitempty" json:"reply_text,omitempty"`
	ReplySender string    `bson:"reply_sender,omitempty" json:"reply_sender,omitempty"`
	ContentLang string    `bson:"content_lang"       json:"content_lang"` // e.g. "en", "hi"
	CreatedAt   time.Time `bson:"created_at"         json:"created_at"`
}
