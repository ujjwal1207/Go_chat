package ws

import (
	"context"
	"time"

	"realtime-chat/internal/db"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SavedMessage struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	SenderID    string             `bson:"sender_id"`
	RecipientID string             `bson:"recipient_id,omitempty"` // DM
	GroupID     string             `bson:"group_id,omitempty"`     // Group
	Content     string             `bson:"content"`
	// Reply metadata
	ReplyTo     string    `bson:"reply_to,omitempty"`
	ReplyText   string    `bson:"reply_text,omitempty"`
	ReplySender string    `bson:"reply_sender,omitempty"`
	ContentLang string    `bson:"content_lang"`
	Files       []string  `bson:"files,omitempty"`
	CreatedAt   time.Time `bson:"created_at"`
	Delivered   bool      `bson:"delivered"`
	DeliveredAt time.Time `bson:"delivered_at,omitempty"`
}

func saveDM(ctx context.Context, fromID, recipientID, text, lang string, files []string, replyTo, replyText, replySender string) error {
	_, err := db.Messages().InsertOne(ctx, SavedMessage{
		SenderID:    fromID,
		RecipientID: recipientID,
		Content:     text,
		ReplyTo:     replyTo,
		ReplyText:   replyText,
		ReplySender: replySender,
		ContentLang: lang,
		Files:       files,
		CreatedAt:   time.Now(),
		Delivered:   false,
	})
	return err
}

func saveGroupMsg(ctx context.Context, fromID, groupID, text, lang string, files []string, replyTo, replyText, replySender string) error {
	_, err := db.Messages().InsertOne(ctx, SavedMessage{
		SenderID:    fromID,
		GroupID:     groupID,
		Content:     text,
		ReplyTo:     replyTo,
		ReplyText:   replyText,
		ReplySender: replySender,
		ContentLang: lang,
		Files:       files,
		CreatedAt:   time.Now(),
	})
	return err
}

// fetchUndeliveredDMs returns undelivered direct messages for recipient
func fetchUndeliveredDMs(ctx context.Context, recipientID string) ([]SavedMessage, error) {
	cur, err := db.Messages().Find(ctx, map[string]interface{}{"recipient_id": recipientID, "delivered": false})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var out []SavedMessage
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// markMessagesDelivered sets delivered=true and delivered_at on given messages
func markMessagesDelivered(ctx context.Context, ids []interface{}) error {
	// update many by _id in ids
	_, err := db.Messages().UpdateMany(ctx, map[string]interface{}{"_id": map[string]interface{}{"$in": ids}}, map[string]interface{}{"$set": map[string]interface{}{"delivered": true, "delivered_at": time.Now()}})
	return err
}
