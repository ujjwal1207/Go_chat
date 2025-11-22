package ws

import (
	"context"
	"time"

	"realtime-chat/internal/db"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GroupDoc struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name"`
	Members   []string           `bson:"members"`
	CreatedBy string             `bson:"created_by"`
	CreatedAt time.Time          `bson:"created_at"`
}

func SaveGroup(ctx context.Context, name string, creator string, members []string) (string, error) {
	// ensure creator is in members
	members = append(members, creator)

	res, err := db.Groups().InsertOne(ctx, bson.M{
		"name":       name,
		"members":    members,
		"created_by": creator,
		"created_at": time.Now(),
	})
	if err != nil {
		return "", err
	}

	oid := res.InsertedID.(primitive.ObjectID)
	return oid.Hex(), nil
}

func AddMemberToGroupDB(ctx context.Context, groupID, userID string) error {
	oid, err := primitive.ObjectIDFromHex(groupID)
	if err != nil {
		return err
	}
	_, err = db.Groups().UpdateByID(ctx, oid, bson.M{
		"$addToSet": bson.M{"members": userID},
	})
	return err
}

func LoadAllGroups(ctx context.Context) ([]GroupDoc, error) {
	cursor, err := db.Groups().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var groups []GroupDoc
	if err = cursor.All(ctx, &groups); err != nil {
		return nil, err
	}

	return groups, nil
}
