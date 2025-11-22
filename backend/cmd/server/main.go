package main

import (
	"log"
	"net/http"
	"strings"

	"realtime-chat/internal/auth"
	"realtime-chat/internal/config"
	"realtime-chat/internal/db"
	"realtime-chat/internal/handlers"
	"realtime-chat/internal/messages"
	"realtime-chat/internal/presence"
	"realtime-chat/internal/ws"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	config.Load()
	db.Connect()

	hub := ws.NewHub()
	presAPI := &presence.PresenceAPI{Hub: hub}
	userHandler := handlers.NewUserHandler(db.Users(), db.Groups(), db.Messages())

	r := chi.NewRouter()

	// CORS middleware
	r.Use(middleware.Logger)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			
			// Check if origin is allowed
			allowed := false
			for _, allowedOrigin := range config.C.AllowedOrigins {
				if strings.TrimSpace(allowedOrigin) == origin {
					allowed = true
					break
				}
			}
			
			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("✅ Realtime Chat API (Mongo + WS)"))
	})

	// Static file server for uploads
	r.Get("/uploads/*", func(w http.ResponseWriter, r *http.Request) {
		fs := http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads/")))
		fs.ServeHTTP(w, r)
	})

	// auth routes
	r.Post("/auth/request-otp", auth.RequestOTPHandler)
	r.Post("/auth/verify-otp", auth.VerifyOTPHandler)

	// protected (JWT)
	r.Group(func(pr chi.Router) {
		pr.Use(auth.AuthMiddleware)

		// me
		pr.Get("/me", auth.MeHandler)
		pr.Put("/me", auth.UpdateMeHandler)

		// presence
		pr.Get("/presence", presAPI.GetPresence)
		pr.Get("/presence/{userId}", presAPI.GetPresenceOf)

		// history
		pr.Get("/messages/dm", messages.GetDMHistory)
		pr.Get("/messages/group", messages.GetGroupHistory)

		// users
		pr.Get("/users/search", userHandler.SearchUsers)
		pr.Post("/conversations/dm", userHandler.CreateDMConversation)

		// conversations
		pr.Get("/conversations", userHandler.GetUserConversations)
		pr.Delete("/conversations/{id}", userHandler.DeleteConversation)

		// file uploads
		pr.Post("/upload", handlers.UploadFile)
	})

	// ws route
	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "token required", http.StatusUnauthorized)
			return
		}

		userID, err := auth.ParseAccessToken(token)
		if err != nil || userID == "" {
			log.Printf("❌ WebSocket auth failed for token: %s, error: %v", token[:20]+"...", err)
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		lang := r.URL.Query().Get("lang")
		if lang == "" {
			lang = "en"
		}

		log.Printf("🔌 WebSocket connection established for user: %s (lang: %s)", userID, lang)
		ws.ServeWS(hub, userID, lang, w, r)
	})

	log.Println("🚀 Server on :" + config.C.Port)
	log.Fatal(http.ListenAndServe(":"+config.C.Port, r))
}
