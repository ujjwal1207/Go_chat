package ws

import (
	"context"
	"encoding/json"
	"log"
	"strings"
)

type IncomingMessage struct {
	Type           string   `json:"type"`                      // "send_message" | "create_group" | "join_group"
	ChatType       string   `json:"chat_type,omitempty"`       // "dm" | "group"   (only for send_message)
	ToUser         string   `json:"to_user,omitempty"`         // for DM
	GroupID        string   `json:"group_id,omitempty"`        // for group ops & group messages
	ConversationID string   `json:"conversation_id,omitempty"` // conversation ID for messages
	Text           string   `json:"text,omitempty"`            // message body
	Files          []string `json:"files,omitempty"`           // file URLs
	Members        []string `json:"members,omitempty"`         // for create_group
	Name           string   `json:"name,omitempty"`            // for create_group
	SourceLang     string   `json:"source_lang,omitempty"`
}

type OutgoingMessage struct {
	Type     string   `json:"type"`                // "message" | "group_created" | "joined_group" | "error"
	ChatType string   `json:"chat_type,omitempty"` // "dm" | "group" (for delivered messages)
	FromUser string   `json:"from_user,omitempty"` // sender
	GroupID  string   `json:"group_id,omitempty"`  // target group
	Text     string   `json:"text,omitempty"`      // delivered text (possibly translated)
	Files    []string `json:"files,omitempty"`     // file URLs
	Lang     string   `json:"lang,omitempty"`      // recipient language
	Error    string   `json:"error,omitempty"`     // error text (when Type="error")
}

// route incoming messages from a client
func handleIncoming(h *Hub, sender *Client, raw []byte) {
	log.Printf("📨 WebSocket received message from user %s: %s", sender.userID, string(raw))

	var msg IncomingMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		log.Println("ws: json decode error:", err)
		_ = sendError(sender, "invalid_json")
		return
	}

	msg.Type = strings.TrimSpace(msg.Type)

	switch msg.Type {

	// 1) SEND MESSAGE (DM or GROUP)
	case "send_message":
		msg.ChatType = strings.TrimSpace(msg.ChatType)
		if msg.ChatType == "dm" {
			if strings.TrimSpace(msg.ToUser) == "" {
				_ = sendError(sender, "to_user_required_for_dm")
				return
			}
			if strings.TrimSpace(msg.ConversationID) == "" {
				_ = sendError(sender, "conversation_id_required")
				return
			}
			srcLang := msg.SourceLang
			if srcLang == "" {
				srcLang = sender.preferredLang
			}
			h.SendDM(sender.userID, msg.ToUser, msg.ConversationID, msg.Text, srcLang, msg.Files)
			return
		}

		if msg.ChatType == "group" {
			if strings.TrimSpace(msg.GroupID) == "" {
				_ = sendError(sender, "group_id_required_for_group_message")
				return
			}
			srcLang := msg.SourceLang
			if srcLang == "" {
				srcLang = sender.preferredLang
			}
			h.SendToGroup(sender.userID, msg.GroupID, msg.Text, srcLang, msg.Files)
			return
		}

		_ = sendError(sender, "unknown_chat_type")

	// 2) CREATE GROUP
	case "create_group":
		name := strings.TrimSpace(msg.Name)
		if name == "" {
			_ = sendError(sender, "group_name_required")
			return
		}

		// persist to DB
		groupID, err := SaveGroup(context.Background(), name, sender.userID, msg.Members)
		if err != nil {
			log.Println("ws: cannot save group:", err)
			_ = sendError(sender, "db_error_creating_group")
			return
		}

		// update in-memory
		h.CreateGroup(groupID, name, append(msg.Members, sender.userID))

		// ack creator
		ack := OutgoingMessage{
			Type:    "group_created",
			GroupID: groupID,
			Text:    "group created",
			Lang:    sender.preferredLang,
		}
		_ = sendJSON(sender, ack)

	// 3) JOIN GROUP
	case "join_group":
		if strings.TrimSpace(msg.GroupID) == "" {
			_ = sendError(sender, "group_id_required_to_join")
			return
		}
		if err := AddMemberToGroupDB(context.Background(), msg.GroupID, sender.userID); err != nil {
			log.Println("ws: db join error:", err)
			_ = sendError(sender, "db_error_join_group")
			return
		}
		h.AddMemberToGroup(msg.GroupID, sender.userID)

		ack := OutgoingMessage{
			Type:    "joined_group",
			GroupID: msg.GroupID,
			Text:    "joined group",
			Lang:    sender.preferredLang,
		}
		_ = sendJSON(sender, ack)

	// UNKNOWN TYPE
	default:
		_ = sendError(sender, "unknown_type")
	}
}

// helpers

func sendJSON(c *Client, v any) error {
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	select {
	case c.send <- b:
	default:
		// client backpressure / closed
	}
	return nil
}

func sendError(c *Client, msg string) error {
	return sendJSON(c, OutgoingMessage{
		Type:  "error",
		Error: msg,
		Lang:  c.preferredLang,
	})
}
