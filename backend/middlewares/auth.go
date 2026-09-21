package midlewares

import (
	"net/http"
	"strings"

	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/utils"
)

func RequireAccessToken(cfg entities.JwtConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
			if !ok || raw == "" {
				w.Header().Set("WWW-Authenticate", `Bearer`)
				utils.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing bearer token"})
				return
			}

			_, err := utils.ParseToken(raw, "access", cfg)
			if err != nil {
				w.Header().Set("WWW-Authenticate", `Bearer error="invalid_token"`)
				utils.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid token"})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
