package auth

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"realtime-chat/internal/db"

	"go.mongodb.org/mongo-driver/bson"
)

func generateOTP() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func storeOTP(ctx context.Context, email, code string) error {
	_, err := db.OTPs().InsertOne(ctx, bson.M{
		"email":      email,
		"code":       code,
		"expires_at": time.Now().Add(10 * time.Minute),
		"used":       false,
	})
	return err
}
