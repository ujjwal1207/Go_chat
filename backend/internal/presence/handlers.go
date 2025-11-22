package presence

import (
	"encoding/json"
	"net/http"

	"realtime-chat/internal/auth"
	"realtime-chat/internal/ws"

	"github.com/go-chi/chi/v5"
)

type PresenceAPI struct{ Hub *ws.Hub }

// GET /presence  (auth required) → { online: ["u1","u2",...] }
func (p *PresenceAPI) GetPresence(w http.ResponseWriter, r *http.Request) {
	_ = auth.UserIDFromContext(r) // (optional: only to ensure auth)
	out := map[string]any{
		"online": p.Hub.OnlineUserIDs(),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}

// GET /presence/{userId}  → { userId: "...", online: true/false }
func (p *PresenceAPI) GetPresenceOf(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"userId": userID,
		"online": p.Hub.IsOnline(userID),
	})
}


// // {
//   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjMwNDgyMDcsInN1YiI6IjY5MTVmNzhiODEyOGM1YTFkYWVlYWY1MiJ9.kbyg6e3--TEjAYS23t4ZxbmV1xcWfGmZ1clrt6rpMBU",
//   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjM2NTIxMDcsInN1YiI6IjY5MTVmNzhiODEyOGM1YTFkYWVlYWY1MiJ9.wIbwTXNHA2XzlVIWGSxOKfac2Nx-OHswNcBIQ7E_puI",
//   "user_id": "6915f78b8128c5a1daeeaf52"
// // }