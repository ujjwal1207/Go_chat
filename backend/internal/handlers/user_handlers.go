package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"realtime-chat/internal/auth"
	"realtime-chat/internal/config"
	"realtime-chat/internal/models"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserHandler struct {
	userCollection     *mongo.Collection
	dmCollection       *mongo.Collection
	messagesCollection *mongo.Collection
}

func NewUserHandler(userCollection, dmCollection, messagesCollection *mongo.Collection) *UserHandler {
	return &UserHandler{
		userCollection:     userCollection,
		dmCollection:       dmCollection,
		messagesCollection: messagesCollection,
	}
}

// -----------------------------------------------------------------------------
// SearchUsers – search by email or displayName (case-insensitive)
// GET /users/search?q=...
// -----------------------------------------------------------------------------
func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	filter := bson.M{
		"$or": []bson.M{
			{"email": bson.M{"$regex": query, "$options": "i"}},
			{"name": bson.M{"$regex": query, "$options": "i"}},
		},
	}

	opts := options.Find().SetLimit(10)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	cursor, err := h.userCollection.Find(ctx, filter, opts)
	if err != nil {
		http.Error(w, "Failed to search users", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err = cursor.All(ctx, &users); err != nil {
		http.Error(w, "Failed to decode users", http.StatusInternalServerError)
		return
	}

	type UserResponse struct {
		ID       string `json:"id"`
		Email    string `json:"email"`
		Name     string `json:"name,omitempty"`
		Avatar   string `json:"avatar,omitempty"`
		IsOnline bool   `json:"isOnline"`
	}

	response := make([]UserResponse, 0, len(users))
	for _, user := range users {
		response = append(response, UserResponse{
			ID:     user.ID,
			Email:  user.Email,
			Name:   user.Name, // Using Name field from actual model
			Avatar: "",        // Not in current model
			// hook this into your presence system later
			IsOnline: false,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// -----------------------------------------------------------------------------
// CreateDMConversation – create or return existing DM conversation
// POST /dm
// body: { "userEmail": "other@user.com" }
// -----------------------------------------------------------------------------
func (h *UserHandler) CreateDMConversation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserEmail string `json:"userEmail"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UserEmail = strings.TrimSpace(req.UserEmail)
	if req.UserEmail == "" {
		http.Error(w, "userEmail is required", http.StatusBadRequest)
		return
	}

	// current user ID should be injected by auth middleware as a string (hex)
	currentUserID := auth.UserIDFromContext(r)
	if currentUserID == "" {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// find target user by email
	var targetUser models.User
	if err := h.userCollection.FindOne(ctx, bson.M{"email": req.UserEmail}).Decode(&targetUser); err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to find user", http.StatusInternalServerError)
		return
	}

	targetUserID := targetUser.ID

	// check if DM already exists - using members field from actual model
	filter := bson.M{
		"members": bson.M{
			"$all":  []string{currentUserID, targetUserID},
			"$size": 2,
		},
	}

	var existingConv models.Group
	err := h.dmCollection.FindOne(ctx, filter).Decode(&existingConv)
	if err != nil && err != mongo.ErrNoDocuments {
		http.Error(w, "Failed to check existing conversation", http.StatusInternalServerError)
		return
	}

	type DMResponse struct {
		ID              string    `json:"id"`
		Type            string    `json:"type"`
		Name            string    `json:"name"`
		Participants    []string  `json:"participants"`
		LastMessage     any       `json:"lastMessage"`
		LastMessageTime time.Time `json:"lastMessageTime"`
		UnreadCount     int       `json:"unreadCount"`
		IsOnline        bool      `json:"isOnline"`
	}

	// if conversation exists, return it
	if err == nil {
		resp := DMResponse{
			ID:              existingConv.ID,
			Type:            "dm", // hardcode since this is always a DM
			Name:            targetUser.Name,
			Participants:    existingConv.Members, // using Members field from actual model
			LastMessage:     nil,
			LastMessageTime: existingConv.CreatedAt, // using CreatedAt since no UpdatedAt
			UnreadCount:     0,
			IsOnline:        false,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
		return
	}

	// create new DM conversation
	now := time.Now().UTC()
	newConv := models.Group{
		Name:      "DM", // Simple name for DMs
		Members:   []string{currentUserID, targetUserID},
		CreatedBy: currentUserID,
		CreatedAt: now,
	}

	result, err := h.dmCollection.InsertOne(ctx, newConv)
	if err != nil {
		http.Error(w, "Failed to create conversation", http.StatusInternalServerError)
		return
	}

	convID := ""
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		convID = oid.Hex()
	}

	resp := DMResponse{
		ID:              convID,
		Type:            "dm", // hardcode since this is always a DM
		Name:            targetUser.Name,
		Participants:    newConv.Members, // using Members field
		LastMessage:     nil,
		LastMessageTime: newConv.CreatedAt, // using CreatedAt
		UnreadCount:     0,
		IsOnline:        false,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// -----------------------------------------------------------------------------
// GetUserConversations – get all conversations for the current user
// GET /conversations
// -----------------------------------------------------------------------------
func (h *UserHandler) GetUserConversations(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from auth middleware
	currentUserID := auth.UserIDFromContext(r)
	if currentUserID == "" {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Find all conversations where user is a member
	filter := bson.M{
		"members": bson.M{"$in": []string{currentUserID}},
	}

	cursor, err := h.dmCollection.Find(ctx, filter)
	if err != nil {
		http.Error(w, "Failed to fetch conversations", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var conversations []models.Group
	if err = cursor.All(ctx, &conversations); err != nil {
		http.Error(w, "Failed to decode conversations", http.StatusInternalServerError)
		return
	}

	type ConversationResponse struct {
		ID              string    `json:"id"`
		Type            string    `json:"type"`
		Name            string    `json:"name"`
		Participants    []string  `json:"participants"`
		LastMessage     any       `json:"lastMessage"`
		LastMessageTime time.Time `json:"lastMessageTime"`
		UnreadCount     int       `json:"unreadCount"`
		IsOnline        bool      `json:"isOnline"`
	}

	response := make([]ConversationResponse, 0, len(conversations))
	for _, conv := range conversations {
		// Determine conversation type and name
		var convType string
		var name string

		// If the conversation has a name other than "DM", it's a group
		// Otherwise, it's a DM (even if it has more than 2 members for some reason)
		if conv.Name != "DM" && conv.Name != "" {
			convType = "group"
			name = conv.Name
		} else {
			convType = "dm"
			// Find the other user
			otherUserID := ""
			for _, memberID := range conv.Members {
				if memberID != currentUserID {
					otherUserID = memberID
					break
				}
			}

			// Get other user's details
			if otherUserID != "" {
				var otherUser models.User
				// Convert string ID to ObjectID for MongoDB query
				objID, err := primitive.ObjectIDFromHex(otherUserID)
				if err == nil {
					userFilter := bson.M{"_id": objID}
					if err := h.userCollection.FindOne(ctx, userFilter).Decode(&otherUser); err == nil {
						// Use display name if available, fallback to name
						if otherUser.DisplayName != "" {
							name = otherUser.DisplayName
						} else {
							name = otherUser.Name
						}
					} else {
						name = "Unknown User"
					}
				} else {
					name = "Unknown User"
				}
			}
		}

		// Get last message time
		lastMessageTime := conv.CreatedAt
		lastMessageFilter := bson.M{"group_id": conv.ID}
		opts := options.FindOne().SetSort(bson.M{"created_at": -1})
		var lastMsg models.Message
		if err := h.messagesCollection.FindOne(ctx, lastMessageFilter, opts).Decode(&lastMsg); err == nil {
			lastMessageTime = lastMsg.CreatedAt
		}

		response = append(response, ConversationResponse{
			ID:              conv.ID,
			Type:            convType,
			Name:            name,
			Participants:    conv.Members,
			LastMessage:     nil, // TODO: Get actual last message
			LastMessageTime: lastMessageTime,
			UnreadCount:     0,     // TODO: Calculate actual unread count
			IsOnline:        false, // TODO: Check online status
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// DELETE /conversations/{id}
func (h *UserHandler) DeleteConversation(w http.ResponseWriter, r *http.Request) {
	me := auth.UserIDFromContext(r)
	conversationID := chi.URLParam(r, "id")

	if conversationID == "" {
		http.Error(w, "conversation ID required", http.StatusBadRequest)
		return
	}

	// Verify the user is a member of the conversation
	oid, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		http.Error(w, "invalid conversation ID", http.StatusBadRequest)
		return
	}

	var conv models.Group
	err = h.dmCollection.FindOne(r.Context(), bson.M{"_id": oid}).Decode(&conv)
	if err != nil {
		http.Error(w, "conversation not found", http.StatusNotFound)
		return
	}

	// Check if user is a member
	isMember := false
	for _, member := range conv.Members {
		if member == me {
			isMember = true
			break
		}
	}

	if !isMember {
		http.Error(w, "forbidden: not a conversation member", http.StatusForbidden)
		return
	}

	// Delete the conversation
	_, err = h.dmCollection.DeleteOne(r.Context(), bson.M{"_id": oid})
	if err != nil {
		http.Error(w, "failed to delete conversation", http.StatusInternalServerError)
		return
	}

	// Delete all messages in the conversation
	_, err = h.messagesCollection.DeleteMany(r.Context(), bson.M{"group_id": conversationID})
	if err != nil {
		// Log error but don't fail the request
		log.Printf("Failed to delete messages for conversation %s: %v", conversationID, err)
	}

	w.WriteHeader(http.StatusNoContent)
}

// UploadFile handles file uploads
func UploadFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get user from context
	userID := auth.UserIDFromContext(r)
	if userID == "" {
		http.Error(w, `{"error": "unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(32 << 20) // 32MB max
	if err != nil {
		http.Error(w, `{"error": "failed to parse form"}`, http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error": "no file provided"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type. Use the parsed media type so values like
	// "audio/webm; codecs=opus" are handled correctly.
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
		"video/mp4":  true,
		// common audio types from browsers
		"audio/mpeg": true,
		"audio/mp3":  true,
		"audio/wav":  true,
		"audio/webm": true,
		"audio/ogg":  true,
	}

	// header may include codecs (e.g. "audio/webm; codecs=opus")
	contentTypeHeader := header.Header.Get("Content-Type")
	mediaType := contentTypeHeader
	if mt, _, err := mime.ParseMediaType(contentTypeHeader); err == nil {
		mediaType = mt
	}

	if !allowedTypes[mediaType] {
		// Log details to help debug browser upload Content-Type variations
		log.Printf("Upload rejected - user=%s content=%s mediaType=%s filename=%s", userID, contentTypeHeader, mediaType, header.Filename)
		// Return helpful message including detected media type for debugging
		msg := fmt.Sprintf("unsupported file type: %s", contentTypeHeader)
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, msg), http.StatusBadRequest)
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("Failed to create upload directory: %v", err)
		http.Error(w, `{"error": "server error"}`, http.StatusInternalServerError)
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%s_%d%s", userID, time.Now().UnixNano(), ext)
	filepath := filepath.Join(uploadDir, filename)

	// Save file
	dst, err := os.Create(filepath)
	if err != nil {
		log.Printf("Failed to create file: %v", err)
		http.Error(w, `{"error": "server error"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		log.Printf("Failed to save file: %v", err)
		http.Error(w, `{"error": "server error"}`, http.StatusInternalServerError)
		return
	}

	// Return file URL
	fileURL := fmt.Sprintf("%s/uploads/%s", config.C.BaseURL, filename)
	response := map[string]interface{}{
		"url":      fileURL,
		"filename": header.Filename,
		"size":     header.Size,
		"type":     header.Header.Get("Content-Type"),
	}

	json.NewEncoder(w).Encode(response)
}
