package handlers

import (
	"net/http"

	"codeberg.org/iklabib/swadidik/utils"
)

func RunHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	utils.WriteJSON(w, http.StatusOK, "run!")
}
