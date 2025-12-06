package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/middleware"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

type SocialHandler struct {
	service services.SocialService
}

func NewSocialHandler(service services.SocialService) *SocialHandler {
	return &SocialHandler{service: service}
}

// GetUserProfile godoc
// @Summary		Get a user's public profile
// @Description	Retrieves a user's public profile including follower counts, collections, and reviews.
// @Tags			Social
// @Produce		json
// @Param			id	path		string	true	"User ID"
// @Success		200	{object}	models.UserPublicProfileDTO
// @Failure		400	{object}	models.ErrorResponseDTO
// @Failure		404	{object}	models.ErrorResponseDTO
// @Router			/users/{id}/profile [get]
func (h *SocialHandler) GetUserProfile(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid user ID"})
		return
	}

	profile, err := h.service.GetUserProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "User not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// FollowUser godoc
// @Summary		Follow a user
// @Description	Subscribes the authenticated user to another user.
// @Tags			Social
// @Produce		json
// @Security		BearerAuth
// @Param			id	path		string	true	"User ID to follow"
// @Success		200	{object}	models.SuccessResponseDTO
// @Failure		400	{object}	models.ErrorResponseDTO
// @Failure		401	{object}	models.ErrorResponseDTO
// @Failure		500	{object}	models.ErrorResponseDTO
// @Router			/users/{id}/follow [post]
func (h *SocialHandler) FollowUser(c *gin.Context) {
	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid target user ID"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	if userID == targetUserID {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "You cannot follow yourself"})
		return
	}

	if err := h.service.FollowUser(userID, targetUserID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Failed to follow user"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Successfully followed user"})
}

// UnfollowUser godoc
// @Summary		Unfollow a user
// @Description	Unsubscribes the authenticated user from another user.
// @Tags			Social
// @Produce		json
// @Security		BearerAuth
// @Param			id	path		string	true	"User ID to unfollow"
// @Success		200	{object}	models.SuccessResponseDTO
// @Failure		400	{object}	models.ErrorResponseDTO
// @Failure		401	{object}	models.ErrorResponseDTO
// @Failure		500	{object}	models.ErrorResponseDTO
// @Router			/users/{id}/follow [delete]
func (h *SocialHandler) UnfollowUser(c *gin.Context) {
	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid target user ID"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	if err := h.service.UnfollowUser(userID, targetUserID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Failed to unfollow user"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Successfully unfollowed user"})
}
