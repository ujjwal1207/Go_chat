package models

import "time"

// Group stores group metadata and memberships.
// Members are stored as string user IDs to match the rest of the codebase.
type Group struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	Name      string    `bson:"name"          json:"name"`
	Members   []string  `bson:"members"       json:"members"`      // user IDs (hex)
	CreatedBy string    `bson:"created_by"    json:"created_by"`   // user ID (hex)
	CreatedAt time.Time `bson:"created_at"    json:"created_at"`
}
