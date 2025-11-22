package messages

import (
	"encoding/json"
	"net/http"
	"strconv"

	"realtime-chat/internal/auth"
	"realtime-chat/internal/db"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func parseLimit(r *http.Request, def int64) int64 {
	l := r.URL.Query().Get("limit")
	if l == "" {
		return def
	}
	if n, err := strconv.ParseInt(l, 10, 64); err == nil && n > 0 && n <= 200 {
		return n
	}
	return def
}

func userInGroup(r *http.Request, groupID, userID string) (bool, error) {
	oid, err := primitive.ObjectIDFromHex(groupID)
	if err != nil {
		return false, err
	}
	var doc struct {
		Members []string `bson:"members"`
	}
	err = db.Groups().FindOne(r.Context(), bson.M{"_id": oid}).Decode(&doc)
	if err != nil {
		return false, err
	}
	for _, m := range doc.Members {
		if m == userID {
			return true, nil
		}
	}
	return false, nil
}

// GET /messages/dm?user_id=<other>&limit=50
func GetDMHistory(w http.ResponseWriter, r *http.Request) {
	me := auth.UserIDFromContext(r)
	other := r.URL.Query().Get("user_id")
	if me == "" || other == "" {
		http.Error(w, "user_id required", http.StatusBadRequest)
		return
	}
	limit := parseLimit(r, 50)

	filter := bson.M{
		"$or": []bson.M{
			{"sender_id": me, "recipient_id": other},
			{"sender_id": other, "recipient_id": me},
		},
	}
	opts := options.Find().SetSort(bson.M{"created_at": -1}).SetLimit(limit)

	cur, err := db.Messages().Find(r.Context(), filter, opts)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer cur.Close(r.Context())

	var out []bson.M
	if err := cur.All(r.Context(), &out); err != nil {
		http.Error(w, "decode error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if out == nil {
		out = []bson.M{}
	}
	json.NewEncoder(w).Encode(out)
}

// GET /messages/group?group_id=<id>&limit=50
func GetGroupHistory(w http.ResponseWriter, r *http.Request) {
	me := auth.UserIDFromContext(r)
	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		http.Error(w, "group_id required", http.StatusBadRequest)
		return
	}
	ok, err := userInGroup(r, groupID, me)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	if !ok {
		http.Error(w, "forbidden: not a group member", http.StatusForbidden)
		return
	}

	limit := parseLimit(r, 50)

	filter := bson.M{"group_id": groupID}
	opts := options.Find().SetSort(bson.M{"created_at": -1}).SetLimit(limit)

	cur, err := db.Messages().Find(r.Context(), filter, opts)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer cur.Close(r.Context())

	var out []bson.M
	if err := cur.All(r.Context(), &out); err != nil {
		http.Error(w, "decode error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if out == nil {
		out = []bson.M{}
	}
	json.NewEncoder(w).Encode(out)
}
