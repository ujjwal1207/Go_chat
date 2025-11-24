package ws

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"realtime-chat/internal/db"
	"realtime-chat/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Group struct {
	ID      string
	Name    string
	Members map[string]bool // userID -> in group
}

// Hub keeps track of online users
type Hub struct {
	mu     sync.RWMutex
	users  map[string]*Client // userID -> client
	groups map[string]*Group  // groupID -> group
}

func NewHub() *Hub {
	hub := &Hub{
		users:  make(map[string]*Client),
		groups: make(map[string]*Group),
	}

	// Load all groups from database into memory
	if err := hub.loadGroupsFromDB(); err != nil {
		log.Printf("⚠️ Failed to load groups from DB: %v", err)
	}

	return hub
}

func (h *Hub) AddClient(userID string, c *Client) {
	h.mu.Lock()
	h.users[userID] = c
	h.mu.Unlock()
}

func (h *Hub) RemoveClient(userID string) {
	h.mu.Lock()
	delete(h.users, userID)
	h.mu.Unlock()
}

func (h *Hub) GetClient(userID string) (*Client, bool) {
	h.mu.RLock()
	c, ok := h.users[userID]
	h.mu.RUnlock()
	return c, ok
}

// send DM with translation hook
func (h *Hub) SendDM(fromID, toID, conversationID, text, fromLang string, files []string, replyTo, replyText, replySender string) {
	log.Printf("💬 Processing DM from %s to %s in conversation %s: %s (lang: %s)", fromID, toID, conversationID, text, fromLang)

	// resolve reply sender to a display name if it's an object id
	resolvedReplySender := resolveUserDisplayName(replySender)

	// persist original message language
	// saveDM expects recipientID for DMs
	err := saveDM(context.Background(), fromID, toID, text, fromLang, files, replyTo, replyText, resolvedReplySender)
	if err != nil {
		log.Printf("❌ Failed to save DM: %v", err)
	} else {
		log.Printf("✅ DM saved to database")
	}

	receiver, ok := h.GetClient(toID)
	if !ok {
		log.Printf("👻 User %s is offline - message saved for later", toID)
		return
	}

	translated := translate(text, fromLang, receiver.preferredLang)
	log.Printf("🌐 Translated message: %s -> %s", text, translated)

	out := OutgoingMessage{
		Type:        "message",
		ChatType:    "dm",
		FromUser:    fromID,
		Text:        translated,
		ReplyTo:     replyTo,
		ReplyText:   replyText,
		ReplySender: resolvedReplySender,
		Files:       files,
		Lang:        receiver.preferredLang,
	}

	b, _ := json.Marshal(out)
	log.Printf("📤 Sending message to user %s: %s", toID, string(b))
	receiver.send <- b
	log.Printf("✅ Message queued for delivery to %s", toID)
}

// create group in memory
func (h *Hub) CreateGroup(id, name string, members []string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	g := &Group{
		ID:      id,
		Name:    name,
		Members: make(map[string]bool),
	}
	for _, m := range members {
		g.Members[m] = true
	}
	h.groups[id] = g
}

func (h *Hub) AddMemberToGroup(groupID, userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if g, ok := h.groups[groupID]; ok {
		g.Members[userID] = true
	}
}

// broadcast to group
func (h *Hub) SendToGroup(fromID, groupID, text, fromLang string, files []string, replyTo, replyText, replySender string) {
	// resolve reply sender to display name
	resolvedReplySender := resolveUserDisplayName(replySender)

	// persist once
	_ = saveGroupMsg(context.Background(), fromID, groupID, text, fromLang, files, replyTo, replyText, resolvedReplySender)

	h.mu.RLock()
	g, ok := h.groups[groupID]
	h.mu.RUnlock()
	if !ok {
		return
	}

	// for each member: if online, send in their lang
	for memberID := range g.Members {
		h.mu.RLock()
		receiver, ok := h.users[memberID]
		h.mu.RUnlock()
		if !ok {
			continue // offline, later we’ll save to DB
		}

		translated := translate(text, fromLang, receiver.preferredLang)

		out := OutgoingMessage{
			Type:        "message",
			ChatType:    "group",
			FromUser:    fromID,
			GroupID:     groupID,
			Text:        translated,
			ReplyTo:     replyTo,
			ReplyText:   replyText,
			ReplySender: resolvedReplySender,
			Lang:        receiver.preferredLang,
			Files:       files,
		}
		b, _ := json.Marshal(out)
		receiver.send <- b
	}
}

// OnlineUserIDs returns a snapshot of currently online user IDs.
func (h *Hub) OnlineUserIDs() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	ids := make([]string, 0, len(h.users))
	for id := range h.users {
		ids = append(ids, id)
	}
	return ids
}

// IsOnline quick check
func (h *Hub) IsOnline(userID string) bool {
	h.mu.RLock()
	_, ok := h.users[userID]
	h.mu.RUnlock()
	return ok
}

// loadGroupsFromDB loads all groups from database into memory
func (h *Hub) loadGroupsFromDB() error {
	groups, err := LoadAllGroups(context.Background())
	if err != nil {
		return err
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	for _, groupDoc := range groups {
		g := &Group{
			ID:      groupDoc.ID.Hex(),
			Name:    groupDoc.Name,
			Members: make(map[string]bool),
		}
		for _, memberID := range groupDoc.Members {
			g.Members[memberID] = true
		}
		h.groups[g.ID] = g
		log.Printf("📋 Loaded group %s (%s) with %d members", g.ID, g.Name, len(g.Members))
	}

	log.Printf("✅ Loaded %d groups from database", len(groups))
	return nil
}

// deliver undelivered DMs to a connected client
func (h *Hub) deliverUndelivered(client *Client) error {
	msgs, err := fetchUndeliveredDMs(context.Background(), client.userID)
	if err != nil {
		return err
	}
	if len(msgs) == 0 {
		return nil
	}

	var ids []interface{}
	for _, m := range msgs {
		// translate content to client's preferred language
		translated := translate(m.Content, m.ContentLang, client.preferredLang)
		// resolve reply sender name for presentation
		resolvedReplySender := resolveUserDisplayName(m.ReplySender)

		out := OutgoingMessage{
			Type:        "message",
			ChatType:    "dm",
			FromUser:    m.SenderID,
			Text:        translated,
			ReplyTo:     m.ReplyTo,
			ReplyText:   m.ReplyText,
			ReplySender: resolvedReplySender,
			Files:       m.Files,
			Lang:        client.preferredLang,
		}
		b, _ := json.Marshal(out)
		client.send <- b
		ids = append(ids, m.ID)
	}

	// mark delivered
	if err := markMessagesDelivered(context.Background(), ids); err != nil {
		log.Printf("⚠️ failed to mark messages delivered for user %s: %v", client.userID, err)
	}
	return nil
}

// resolveUserDisplayName attempts to convert a user identifier (possibly an ObjectID hex)
// into a human-friendly display name. If lookup fails, returns the original identifier.
func resolveUserDisplayName(identifier string) string {
	if identifier == "" {
		return ""
	}
	// If identifier looks like an ObjectID, try to resolve
	if oid, err := primitive.ObjectIDFromHex(identifier); err == nil {
		var u models.User
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := db.Users().FindOne(ctx, bson.M{"_id": oid}).Decode(&u); err == nil {
			if u.DisplayName != "" {
				return u.DisplayName
			}
			if u.Name != "" {
				return u.Name
			}
			return u.ID
		}
	}
	// Not an ObjectID or lookup failed — assume it's already a name
	return identifier
}
