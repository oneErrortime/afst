package handlers

import (
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/middleware"

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

	authProtected := api.Group("/auth").Use(authMiddleware)
	{
		authProtected.GET("/me", handlers.Auth.GetMe)
	}

	protectedBooks := api.Group("/books").Use(authMiddleware)
	{
		protectedBooks.POST("", handlers.Book.CreateBook)
		protectedBooks.PUT("/:id", handlers.Book.UpdateBook)
		protectedBooks.DELETE("/:id", handlers.Book.DeleteBook)
		protectedBooks.POST("/:id/files", handlers.BookFile.Upload)
		protectedBooks.GET("/:id/files", handlers.BookFile.GetByBookID)
		protectedBooks.GET("/:id/stats", handlers.ReadingSession.GetBookStats)
	}

	readers := api.Group("/readers").Use(authMiddleware)
	{
		readers.POST("", handlers.Reader.CreateReader)
		readers.GET("", handlers.Reader.GetAllReaders)
		readers.GET("/:id", handlers.Reader.GetReader)
		readers.PUT("/:id", handlers.Reader.UpdateReader)
		readers.DELETE("/:id", handlers.Reader.DeleteReader)
	}

	borrow := api.Group("/borrow").Use(authMiddleware)
	{
		borrow.POST("", handlers.Borrow.BorrowBook)
		borrow.POST("/return", handlers.Borrow.ReturnBook)
		borrow.GET("/reader/:reader_id", handlers.Borrow.GetBorrowedBooks)
	}

	protectedCategories := api.Group("/categories").Use(authMiddleware)
	{
		protectedCategories.POST("", handlers.Category.Create)
		protectedCategories.PUT("/:id", handlers.Category.Update)
		protectedCategories.DELETE("/:id", handlers.Category.Delete)
	}

	protectedGroups := api.Group("/groups").Use(authMiddleware)
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
		subscriptions.POST("", handlers.Subscription.Create)
		subscriptions.GET("/:id", handlers.Subscription.GetByID)
		subscriptions.POST("/:id/cancel", handlers.Subscription.Cancel)
		subscriptions.POST("/:id/renew", handlers.Subscription.Renew)
	}

	access := api.Group("/access").Use(authMiddleware)
	{
		access.POST("", handlers.BookAccess.GrantAccess)
		access.GET("/library", handlers.BookAccess.GetMyLibrary)
		access.GET("/:id", handlers.BookAccess.GetByID)
		access.GET("/check/:book_id", handlers.BookAccess.CheckAccess)
		access.POST("/borrow/:book_id", handlers.BookAccess.BorrowBook)
		access.POST("/:id/revoke", handlers.BookAccess.RevokeAccess)
		access.PUT("/:id/progress", handlers.BookAccess.UpdateProgress)
	}

	files := api.Group("/files").Use(authMiddleware)
	{
		files.GET("/:id", handlers.BookFile.ServeFile)
		files.DELETE("/:id", handlers.BookFile.Delete)
	}

	sessions := api.Group("/reading-sessions").Use(authMiddleware)
	{
		sessions.POST("", handlers.ReadingSession.StartSession)
		sessions.POST("/:id/end", handlers.ReadingSession.EndSession)
		sessions.GET("/my", handlers.ReadingSession.GetMySessions)
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "OK",
			"service": "library-api",
			"version": "2.0",
		})
	})

	return router
}
