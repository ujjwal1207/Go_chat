package models

import "time"

// User represents an account in the system.
// NOTE: we use string IDs (hex of Mongo ObjectID) across the codebase for simplicity.
// The DB's _id will be an ObjectID; when you read it you can convert to Hex for external use.
type User struct {
	ID          string     `bson:"_id,omitempty" json:"id"`
	Email       string     `bson:"email"          json:"email"`
	Name        string     `bson:"name,omitempty" json:"name,omitempty"`
	DisplayName string     `bson:"display_name,omitempty" json:"display_name,omitempty"`
	IsVerified  bool       `bson:"is_verified"    json:"is_verified"`
	Locale      string     `bson:"locale,omitempty" json:"locale,omitempty"`     // e.g. "en", "hi"
	Language    string     `bson:"language,omitempty" json:"language,omitempty"` // e.g. "en", "hi" (alias for locale)
	CreatedAt   time.Time  `bson:"created_at"     json:"created_at"`
	UpdatedAt   *time.Time `bson:"updated_at,omitempty" json:"updated_at,omitempty"`
	LastSeenAt  *time.Time `bson:"last_seen_at,omitempty" json:"last_seen_at,omitempty"`
}
