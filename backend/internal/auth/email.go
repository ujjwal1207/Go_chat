package auth

import (
	"fmt"
	"net/smtp"
	"realtime-chat/internal/config"
)

func sendOTPEmail(toEmail, otp string) error {
	host := config.C.EmailHost
	port := config.C.EmailPort
	user := config.C.EmailUser
	pass := config.C.EmailPass

	auth := smtp.PlainAuth("", user, pass, host)

	msg := []byte("To: " + toEmail + "\r\n" +
		"Subject: Your OTP Code\r\n" +
		"\r\n" +
		"Your OTP is: " + otp + "\r\n")

	addr := fmt.Sprintf("%s:%d", host, port)
	return smtp.SendMail(addr, auth, user, []string{toEmail}, msg)
}
