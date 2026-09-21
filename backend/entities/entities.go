package entities

type TokenRequest struct {
	UserName string `json:"username"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	ExpiresAt    int64    `json:"expires_at"`
	Roles        []string `json:"roles,omitempty"`
}
