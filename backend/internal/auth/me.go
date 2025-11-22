package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"realtime-chat/internal/db"
	"realtime-chat/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GET /me  (auth required) → returns complete user profile
func MeHandler(w http.ResponseWriter, r *http.Request) {
	userID := UserIDFromContext(r)
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Convert userID string to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	// Fetch user from database
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user models.User
	err = db.Users().FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	// Return user data in format expected by frontend
	response := map[string]interface{}{
		"user_id":      user.ID,
		"email":        user.Email,
		"name":         user.Name,
		"display_name": user.DisplayName,
		"language":     user.Language,
		"locale":       user.Locale,
		"is_verified":  user.IsVerified,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// PUT /me  (auth required) → updates user profile
func UpdateMeHandler(w http.ResponseWriter, r *http.Request) {
	userID := UserIDFromContext(r)
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var updateData struct {
		Name        string `json:"name,omitempty"`
		DisplayName string `json:"displayName,omitempty"`
		Language    string `json:"language,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Convert userID string to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	// Build update document
	update := bson.M{"$set": bson.M{}}

	// Handle name and displayName - sync both fields
	if updateData.Name != "" {
		update["$set"].(bson.M)["name"] = updateData.Name
		update["$set"].(bson.M)["display_name"] = updateData.Name // Sync displayName with name
	}
	if updateData.DisplayName != "" {
		update["$set"].(bson.M)["display_name"] = updateData.DisplayName
		update["$set"].(bson.M)["name"] = updateData.DisplayName // Sync name with displayName
	}

	// Handle language - sync with locale field
	if updateData.Language != "" {
		update["$set"].(bson.M)["language"] = updateData.Language
		update["$set"].(bson.M)["locale"] = updateData.Language // Sync locale with language
	}

	// Always update timestamp
	now := time.Now()
	update["$set"].(bson.M)["updated_at"] = &now

	// Update user in database
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	_, err = db.Users().UpdateOne(ctx, bson.M{"_id": objectID}, update)
	if err != nil {
		http.Error(w, "failed to update user", http.StatusInternalServerError)
		return
	}

	// Fetch updated user
	var user models.User
	err = db.Users().FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	// Return updated user data
	response := map[string]interface{}{
		"user_id":      user.ID,
		"email":        user.Email,
		"name":         user.Name,
		"display_name": user.DisplayName,
		"language":     user.Language,
		"locale":       user.Locale,
		"is_verified":  user.IsVerified,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
