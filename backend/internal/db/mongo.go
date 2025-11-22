package db

import (
	"context"
	"log"
	"time"

	"realtime-chat/internal/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	Client   *mongo.Client
	Database *mongo.Database
)

func Connect() {
	// Increase timeout for MongoDB Atlas (clusters can take time to wake up)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Configure client options for better Atlas compatibility
	clientOptions := options.Client().
		ApplyURI(config.C.MongoURI).
		SetServerSelectionTimeout(30 * time.Second).
		SetConnectTimeout(30 * time.Second)

	log.Printf("🔄 Connecting to MongoDB Atlas...")
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("❌ Mongo connect error: %v", err)
	}

	log.Printf("🔄 Pinging MongoDB Atlas...")
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("❌ Mongo ping failed: %v", err)
	}

	Client = client
	Database = client.Database(config.C.MongoDB)
	log.Println("✅ Connected to MongoDB:", config.C.MongoDB)
}

// handy collection getters
func Users() *mongo.Collection    { return Database.Collection("users") }
func OTPs() *mongo.Collection     { return Database.Collection("email_otps") }
func Messages() *mongo.Collection { return Database.Collection("messages") }
func Groups() *mongo.Collection   { return Database.Collection("groups") }
