package auth

import (
	"fmt"
	"net/smtp"
	"realtime-chat/internal/config"
)

func sendOTPEmail(toEmail, otp string) error {
	host := config.C.EmailHost
	port := config.C.EmailPort
	user := config.C.EmailUser // This is your Brevo Login (e.g., 9c4e7...)
	pass := config.C.EmailPass

	// ⬇️ CHANGE THIS to the email you verified in Brevo (e.g., your Gmail)
	senderEmail := "sharmaujjwal2019@gmail.com"

	auth := smtp.PlainAuth("", user, pass, host)

	// We must include the "From" header, otherwise it looks like spam!
	msg := []byte(fmt.Sprintf("From: %s\r\n", senderEmail) +
		"To: " + toEmail + "\r\n" +
		"Subject: Your RealChat OTP Code\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		"<html><body>" +
		"<h3>Your Verification Code</h3>" +
		"<p>Your OTP is: <strong>" + otp + "</strong></p>" +
		"<p>This code expires in 10 minutes.</p>" +
		"</body></html>")

	addr := fmt.Sprintf("%s:%d", host, port)

	// Use senderEmail here, NOT 'user' (which is the SMTP login ID)
	return smtp.SendMail(addr, auth, senderEmail, []string{toEmail}, msg)
}
