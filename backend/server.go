package backend

import (
	"encoding/json"
	"net/http"
	"time"

	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/utils"
	"github.com/golang-jwt/jwt/v5"
)

func NewServer(jwtSecret []byte) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /auth/token", tokenHandler(jwtSecret))
	mux.HandleFunc("POST /run", runHandler(jwtSecret))
	return mux
}

type Server struct {
	Mux http.ServeMux
}

func tokenHandler(jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()

		request := entities.TokenRequest{}
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
		if err := decoder.Decode(&request); err != nil {
			utils.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid token request"})
			return
		}

		now := time.Now()
		expiresAt := now.Add(time.Duration(time.Hour * 24))
		newClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user": request.UserName,
			"iat":  now.Unix(),
			"exp":  expiresAt.Unix(),
		})

		newToken, err := newClaims.SignedString(jwtSecret)
		if err != nil {
			utils.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not generate token"})
			return
		}

		ret := entities.TokenResponse{
			AccessToken:  newToken,
			RefreshToken: "",
			ExpiresAt:    expiresAt.Unix(),
		}
		utils.WriteJSON(w, http.StatusCreated, ret)
	}
}

func runHandler(jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bearerToken := r.Header.Get("Authorization")
		claims, err := utils.Claim(jwtSecret, bearerToken)
		if err != nil {
			utils.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid token claims"})
			return
		}

		utils.WriteJSON(w, http.StatusOK, claims)
	}
}
