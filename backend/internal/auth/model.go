package auth

import "time"

type User struct {
	ID         string    `bson:"_id,omitempty" json:"id"`
	Email      string    `bson:"email" json:"email"`
	Name       string    `bson:"name,omitempty" json:"name,omitempty"`
	IsVerified bool      `bson:"is_verified" json:"is_verified"`
	CreatedAt  time.Time `bson:"created_at" json:"created_at"`
}

type EmailOTP struct {
	ID        string    `bson:"_id,omitempty"`
	Email     string    `bson:"email"`
	Code      string    `bson:"code"`
	ExpiresAt time.Time `bson:"expires_at"`
	Used      bool      `bson:"used"`
}
