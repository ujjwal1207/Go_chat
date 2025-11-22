package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// allow all for now; add origin checks later
		return true
	},
}

type Client struct {
	hub           *Hub
	conn          *websocket.Conn
	send          chan []byte
	userID        string
	preferredLang string
}

// ServeWS upgrades HTTP to WS, verifies token, and registers client
func ServeWS(hub *Hub, userID, lang string, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}

	log.Printf("✅ WebSocket upgraded for user %s", userID)

	client := &Client{
		hub:           hub,
		conn:          conn,
		send:          make(chan []byte, 256),
		userID:        userID,
		preferredLang: lang,
	}

	hub.AddClient(userID, client)
	log.Printf("👥 User %s added to hub", userID)

	// start read + write pumps
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.RemoveClient(c.userID)
		c.conn.Close()
	}()

	for {
		_, msgBytes, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}

		// handle incoming JSON
		handleIncoming(c.hub, c, msgBytes)
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Println("write:", err)
			break
		}
	}
}
