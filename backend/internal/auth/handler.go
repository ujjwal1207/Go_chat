package auth

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"realtime-chat/internal/db"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type requestOTPBody struct {
	Email string `json:"email"`
}

func RequestOTPHandler(w http.ResponseWriter, r *http.Request) {
	var body requestOTPBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	body.Email = strings.TrimSpace(body.Email)
	if body.Email == "" {
		http.Error(w, "email required", http.StatusBadRequest)
		return
	}

	code := generateOTP()

	if err := storeOTP(r.Context(), body.Email, code); err != nil {
		http.Error(w, "cannot store otp", http.StatusInternalServerError)
		return
	}

	// Try to send via SMTP. If it fails, log the error and also
	// print the OTP to the server log so developers can continue
	// testing without a configured SMTP provider.
	if err := sendOTPEmail(body.Email, code); err != nil {
		// don't fail the request for UX reasons, but log the error
		log.Printf("❌ failed to send OTP email to %s: %v", body.Email, err)
		log.Printf("ℹ️ OTP for %s is %s (logged because email failed)", body.Email, code)
	} else {
		log.Printf("✅ OTP sent to %s", body.Email)
	}

	// Always log OTP for testing purposes (remove in production)
	log.Printf("🔑 DEBUG - OTP for %s: %s", body.Email, code)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "otp sent",
	})
}

type verifyOTPBody struct {
	Email string `json:"email"`
	Code  string `json:"code"`
	Name  string `json:"name"`
}

func VerifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	var body verifyOTPBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// 1. OTP find
	var otp EmailOTP
	err := db.OTPs().FindOne(r.Context(), bson.M{
		"email": body.Email,
		"code":  body.Code,
		"used":  false,
		"expires_at": bson.M{
			"$gt": time.Now(),
		},
	}).Decode(&otp)
	if err != nil {
		http.Error(w, "invalid or expired otp", http.StatusBadRequest)
		return
	}

	// 2. User upsert
	var user User
	err = db.Users().FindOne(r.Context(), bson.M{"email": body.Email}).Decode(&user)
	if err != nil {
		// user not found → create
		res, err := db.Users().InsertOne(r.Context(), bson.M{
			"email":       body.Email,
			"name":        body.Name,
			"is_verified": true,
			"created_at":  time.Now(),
		})
		if err != nil {
			http.Error(w, "cannot create user", http.StatusInternalServerError)
			return
		}
		oid := res.InsertedID.(primitive.ObjectID)
		user.ID = oid.Hex()
		user.Email = body.Email
		user.Name = body.Name
		user.IsVerified = true
	} else {
		// user exists → ensure verified
		user.IsVerified = true
		_, _ = db.Users().UpdateOne(r.Context(),
			bson.M{"email": body.Email},
			bson.M{"$set": bson.M{"is_verified": true}},
		)
	}

	// 3. mark otp used
	db.OTPs().UpdateOne(
		context.Background(),
		bson.M{"email": body.Email, "code": body.Code},
		bson.M{"$set": bson.M{"used": true}},
	)

	// 4. issue tokens
	access, _ := GenerateAccessToken(user.ID)
	refresh, _ := GenerateRefreshToken(user.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"access_token":  access,
		"refresh_token": refresh,
		"user_id":       user.ID,
	})
}
