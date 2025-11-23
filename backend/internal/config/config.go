package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type AppConfig struct {
	MongoURI      string
	MongoDB       string
	AccessSecret  string
	RefreshSecret string
	EmailHost     string
	EmailPort     int
	EmailUser     string
	EmailPass     string
	ClientURL     string
	BaseURL       string
	Port          string
}

var C AppConfig

func Load() {
	_ = godotenv.Load()

	port, _ := strconv.Atoi(os.Getenv("EMAIL_PORT"))
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5000"
	}
	C = AppConfig{
		MongoURI:      os.Getenv("MONGODB_URI"),
		MongoDB:       os.Getenv("MONGODB_DB"),
		AccessSecret:  os.Getenv("JWT_ACCESS_SECRET"),
		RefreshSecret: os.Getenv("JWT_REFRESH_SECRET"),
		EmailHost:     os.Getenv("EMAIL_HOST"),
		EmailPort:     port,
		EmailUser:     os.Getenv("EMAIL_USER"),
		EmailPass:     os.Getenv("EMAIL_PASS"),
		ClientURL:     os.Getenv("CLIENT_URL"),
		BaseURL:       baseURL,
		Port:          os.Getenv("PORT"),
		// no sendgrid key
	}

	if C.MongoURI == "" {
		log.Fatal("❌ MONGODB_URI missing in .env")
	}
	log.Println("✅ Config loaded successfully")
}
