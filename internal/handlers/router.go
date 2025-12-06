package handlers

import (
	"net/http"

	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/middleware"
	"github.com/oneErrortime/afst/internal/models"

	"github.com/gin-gonic/gin"
)

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func SetupRoutes(handlers *Handlers, jwtService *auth.JWTService) *gin.Engine {
	router := gin.Default()

	router.Use(corsMiddleware())
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.APIRouteMismatchLogger())

	api := router.Group("/api/v1")

	setupGroup := api.Group("/setup")
	{
		setupGroup.GET("/status", handlers.Setup.GetStatus)
		setupGroup.POST("/create-admin", handlers.Setup.CreateAdmin)
	}

	api.Use(middleware.MaintenanceMiddleware(handlers.Services.FeatureFlag))

	authGroup := api.Group("/auth")
	{
		authGroup.POST("/register", handlers.Auth.Register)
		authGroup.POST("/login", handlers.Auth.Login)
	}

	books := api.Group("/books")
	{
		books.GET("", handlers.Book.GetAllBooks)
		books.GET("/:id", handlers.Book.GetBook)
	}

	categories := api.Group("/categories")
	{
		categories.GET("", handlers.Category.GetAll)
		categories.GET("/:id", handlers.Category.GetByID)
		categories.GET("/slug/:slug", handlers.Category.GetBySlug)
		categories.GET("/:id/children", handlers.Category.GetChildren)
	}

	groups := api.Group("/groups")
	{
		groups.GET("", handlers.UserGroup.GetAll)
		groups.GET("/:id", handlers.UserGroup.GetByID)
	}

	subscriptionPlans := api.Group("/subscription-plans")
	{
		subscriptionPlans.GET("", handlers.Subscription.GetPlans)
	}

	authMiddleware := middleware.AuthMiddleware(jwtService)
	requireAdmin := middleware.RequireAdmin()
	requireLibrarian := middleware.RequireLibrarianOrAdmin()

	authProtected := api.Group("/auth").Use(authMiddleware)
	{
		authProtected.GET("/me", handlers.Auth.GetMe)
	}

	adminUsers := api.Group("/users").Use(authMiddleware, requireAdmin)
	{
		adminUsers.GET("", handlers.Auth.ListUsers)
		adminUsers.PUT("/:id", handlers.Auth.UpdateUserByAdmin)
		adminUsers.POST("/admin", handlers.Auth.CreateAdmin)
	}

	protectedBooks := api.Group("/books").Use(authMiddleware, requireLibrarian)
	{
		protectedBooks.POST("", handlers.Book.CreateBook)
		protectedBooks.PUT("/:id", handlers.Book.UpdateBook)
		protectedBooks.DELETE("/:id", handlers.Book.DeleteBook)
		protectedBooks.POST("/:id/files", handlers.BookFile.Upload)
		protectedBooks.GET("/:id/files", handlers.BookFile.GetByBookID)
		protectedBooks.GET("/:id/stats", handlers.ReadingSession.GetBookStats)
	}

	readers := api.Group("/readers").Use(authMiddleware, requireLibrarian)
	{
		readers.POST("", handlers.Reader.CreateReader)
		readers.GET("", handlers.Reader.GetAllReaders)
		readers.GET("/:id", handlers.Reader.GetReader)
		readers.PUT("/:id", handlers.Reader.UpdateReader)
		readers.DELETE("/:id", handlers.Reader.DeleteReader)
	}

	borrow := api.Group("/borrow").Use(authMiddleware, requireLibrarian)
	{
		borrow.POST("", handlers.Borrow.BorrowBook)
		borrow.POST("/return", handlers.Borrow.ReturnBook)
		borrow.GET("/reader/:reader_id", handlers.Borrow.GetBorrowedBooks)
	}

	protectedCategories := api.Group("/categories").Use(authMiddleware, requireLibrarian)
	{
		protectedCategories.POST("", handlers.Category.Create)
		protectedCategories.PUT("/:id", handlers.Category.Update)
		protectedCategories.DELETE("/:id", handlers.Category.Delete)
	}

	protectedGroups := api.Group("/groups").Use(authMiddleware, requireAdmin)
	{
		protectedGroups.POST("", handlers.UserGroup.Create)
		protectedGroups.PUT("/:id", handlers.UserGroup.Update)
		protectedGroups.DELETE("/:id", handlers.UserGroup.Delete)
		protectedGroups.GET("/:id/users", handlers.UserGroup.GetUsers)
		protectedGroups.POST("/:id/users", handlers.UserGroup.AssignUser)
	}

	subscriptions := api.Group("/subscriptions").Use(authMiddleware)
	{
		subscriptions.GET("/my", handlers.Subscription.GetMySubscription)
		subscriptions.POST("/subscribe", handlers.Subscription.Subscribe)
		subscriptions.POST("/:id/cancel", handlers.Subscription.Cancel)
		subscriptions.POST("/:id/renew", handlers.Subscription.Renew)
	}

	adminSubscriptions := api.Group("/subscriptions").Use(authMiddleware, requireAdmin)
	{
		adminSubscriptions.POST("", handlers.Subscription.Create)
		adminSubscriptions.GET("/:id", handlers.Subscription.GetByID)
	}

	access := api.Group("/access").Use(authMiddleware)
	{
		access.GET("/library", handlers.BookAccess.GetMyLibrary)
		access.GET("/check/:book_id", handlers.BookAccess.CheckAccess)
		access.POST("/borrow/:book_id", handlers.BookAccess.BorrowBook)
		access.PUT("/:id/progress", handlers.BookAccess.UpdateProgress)
	}

	adminAccess := api.Group("/access").Use(authMiddleware, requireLibrarian)
	{
		adminAccess.POST("", handlers.BookAccess.GrantAccess)
		adminAccess.GET("/:id", handlers.BookAccess.GetByID)
		adminAccess.POST("/:id/revoke", handlers.BookAccess.RevokeAccess)
	}

	files := api.Group("/files").Use(authMiddleware)
	{
		files.GET("/:id", handlers.BookFile.ServeFile)
	}

	adminFiles := api.Group("/files").Use(authMiddleware, requireLibrarian)
	{
		adminFiles.DELETE("/:id", handlers.BookFile.Delete)
	}

	sessions := api.Group("/reading-sessions").Use(authMiddleware)
	{
		sessions.POST("", handlers.ReadingSession.StartSession)
		sessions.POST("/:id/end", handlers.ReadingSession.EndSession)
		sessions.GET("/my", handlers.ReadingSession.GetMySessions)
	}

	collections := api.Group("/collections").Use(authMiddleware)
	{
		collections.POST("", handlers.Collection.CreateCollection)
		collections.GET("", handlers.Collection.GetCollections)
		collections.GET("/:id", handlers.Collection.GetCollectionByID)
		collections.PUT("/:id", handlers.Collection.UpdateCollection)
		collections.DELETE("/:id", handlers.Collection.DeleteCollection)
		collections.POST("/:id/books", handlers.Collection.AddBookToCollection)
		collections.DELETE("/:id/books/:book_id", handlers.Collection.RemoveBookFromCollection)
	}

	reviews := api.Group("/reviews")
	{
		reviews.GET("/book/:book_id", handlers.Review.GetReviewsByBook)

		authProtectedReviews := reviews.Use(authMiddleware)
		authProtectedReviews.POST("", handlers.Review.CreateReview)
		authProtectedReviews.PUT("/:id", handlers.Review.UpdateReview)
		authProtectedReviews.DELETE("/:id", handlers.Review.DeleteReview)
	}

	bookmarks := api.Group("/bookmarks").Use(authMiddleware)
	{
		bookmarks.POST("", handlers.Bookmark.CreateBookmark)
		bookmarks.GET("/book/:book_id", handlers.Bookmark.GetBookmarksByBook)
		bookmarks.DELETE("/:id", handlers.Bookmark.DeleteBookmark)
	}

	api.GET("/stats/dashboard", authMiddleware, requireLibrarian, handlers.GetDashboardStats)

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "OK",
			"service": "library-api",
			"version": "2.0",
		})
	})

	return router
}

func SetupExtendedRoutes(handlers *Handlers, jwtService *auth.JWTService) *gin.Engine {
	return SetupRoutes(handlers, jwtService)
}

func (h *Handlers) GetDashboardStats(c *gin.Context) {
	stats := models.DashboardStatsDTO{}

	totalBooks, err := h.Services.Book.Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count books"})
		return
	}
	stats.TotalBooks = totalBooks

	publishedBooks, err := h.Services.Book.CountPublished()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count published books"})
		return
	}

	totalUsers, err := h.Services.Reader.Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}
	stats.TotalUsers = totalUsers

	totalGroups, err := h.Services.UserGroup.Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count groups"})
		return
	}
	stats.TotalGroups = totalGroups

	totalCategories, err := h.Services.Category.Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count categories"})
		return
	}
	stats.TotalCategories = totalCategories

	c.JSON(http.StatusOK, gin.H{
		"total_users":            stats.TotalUsers,
		"total_books":            stats.TotalBooks,
		"published_books":        publishedBooks,
		"total_categories":       stats.TotalCategories,
		"total_groups":           stats.TotalGroups,
		"active_loans":           stats.ActiveLoans,
		"active_subscriptions":   stats.ActiveSubscriptions,
		"total_reading_sessions": stats.TotalReadingSessions,
	})
}
