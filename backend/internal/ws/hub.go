package ws

import (
	"context"
	"encoding/json"
	"log"
	"sync"
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
func (h *Hub) SendDM(fromID, toID, conversationID, text, fromLang string, files []string) {
	log.Printf("💬 Processing DM from %s to %s in conversation %s: %s (lang: %s)", fromID, toID, conversationID, text, fromLang)

	// persist original message language
	err := saveDM(context.Background(), fromID, conversationID, text, fromLang, files)
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
		Type:     "message",
		ChatType: "dm",
		FromUser: fromID,
		Text:     translated,
		Files:    files,
		Lang:     receiver.preferredLang,
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
func (h *Hub) SendToGroup(fromID, groupID, text, fromLang string, files []string) {
	// persist once
	_ = saveGroupMsg(context.Background(), fromID, groupID, text, fromLang, files)

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
			Type:     "message",
			ChatType: "group",
			FromUser: fromID,
			GroupID:  groupID,
			Text:     translated,
			Lang:     receiver.preferredLang,
			Files:    files,
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
