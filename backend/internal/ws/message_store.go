package ws

import (
	"context"
	"time"

	"realtime-chat/internal/db"
)

type SavedMessage struct {
	SenderID    string    `bson:"sender_id"`
	RecipientID string    `bson:"recipient_id,omitempty"` // DM
	GroupID     string    `bson:"group_id,omitempty"`     // Group
	Content     string    `bson:"content"`
	ContentLang string    `bson:"content_lang"`
	Files       []string  `bson:"files,omitempty"`
	CreatedAt   time.Time `bson:"created_at"`
}

func saveDM(ctx context.Context, fromID, conversationID, text, lang string, files []string) error {
	_, err := db.Messages().InsertOne(ctx, SavedMessage{
		SenderID:    fromID,
		GroupID:     conversationID,
		Content:     text,
		ContentLang: lang,
		Files:       files,
		CreatedAt:   time.Now(),
	})
	return err
}

func saveGroupMsg(ctx context.Context, fromID, groupID, text, lang string, files []string) error {
	_, err := db.Messages().InsertOne(ctx, SavedMessage{
		SenderID:    fromID,
		GroupID:     groupID,
		Content:     text,
		ContentLang: lang,
		Files:       files,
		CreatedAt:   time.Now(),
	})
	return err
}
