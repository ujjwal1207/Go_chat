package ws

func translate(text, from, to string) string {
	if from == "" {
		from = "auto"
	}
	if to == "" || from == to {
		return text
	}
	// TODO: call real translation service
	return "[translated " + from + "->" + to + "] " + text
}
