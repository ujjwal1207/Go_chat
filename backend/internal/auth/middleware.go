package auth

import (
	"context"
	"log"
	"net/http"
	"strings"
)

type ctxKey string

const UserIDKey ctxKey = "userID"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ah := r.Header.Get("Authorization") // "Bearer <token>"
		log.Printf("🔐 AUTH DEBUG - Method: %s, Path: %s", r.Method, r.URL.Path)
		log.Printf("🔐 AUTH DEBUG - Authorization header: '%s'", ah)

		parts := strings.SplitN(ah, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			log.Printf("🔐 AUTH DEBUG - Invalid header format. Parts: %v", parts)
			http.Error(w, "missing bearer token", http.StatusUnauthorized)
			return
		}

		log.Printf("🔐 AUTH DEBUG - Token preview: %s...", parts[1][:20])
		userID, err := ParseAccessToken(parts[1])
		if err != nil || userID == "" {
			log.Printf("🔐 AUTH DEBUG - Token parse failed. Error: %v, UserID: %s", err, userID)
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		log.Printf("🔐 AUTH DEBUG - Authentication successful for user: %s", userID)
		ctx := r.Context()
		ctx = contextWithUserID(ctx, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func contextWithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}

func UserIDFromContext(r *http.Request) string {
	v := r.Context().Value(UserIDKey)
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
