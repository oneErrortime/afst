package handlers

import (
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

	books, _ := h.Services.Book.GetAllBooks(1000, 0)
	stats.TotalBooks = int64(len(books))
	var publishedBooks int64
	for _, b := range books {
		if b.Status == "published" {
			publishedBooks++
		}
	}

	readers, _ := h.Services.Reader.GetAllReaders(1000, 0)
	stats.TotalUsers = int64(len(readers))

	groups, _ := h.Services.UserGroup.GetAll()
	stats.TotalGroups = int64(len(groups))

	categories, _ := h.Services.Category.GetAll()
	stats.TotalCategories = int64(len(categories))

	c.JSON(200, gin.H{
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
