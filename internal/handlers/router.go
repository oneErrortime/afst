package handlers

import (
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes настраивает все маршруты API
func SetupRoutes(handlers *Handlers, jwtService *auth.JWTService) *gin.Engine {
	router := gin.Default()

	// Добавляем middleware для CORS, логирования и т.д.
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// API группа
	api := router.Group("/api/v1")

	// Публичные маршруты (аутентификация)
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Auth.Register)
		auth.POST("/login", handlers.Auth.Login)
	}

	// Публичные маршруты для книг (только чтение)
	// Согласно техническому заданию, список книг может быть публичным
	books := api.Group("/books")
	{
		books.GET("", handlers.Book.GetAllBooks)
		books.GET("/:id", handlers.Book.GetBook)
	}

	// Защищенные маршруты (требуют JWT)
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Управление книгами (защищенные операции)
	protectedBooks := api.Group("/books").Use(authMiddleware)
	{
		protectedBooks.POST("", handlers.Book.CreateBook)
		protectedBooks.PUT("/:id", handlers.Book.UpdateBook)
		protectedBooks.DELETE("/:id", handlers.Book.DeleteBook)
	}

	// Управление читателями (все операции защищены)
	readers := api.Group("/readers").Use(authMiddleware)
	{
		readers.POST("", handlers.Reader.CreateReader)
		readers.GET("", handlers.Reader.GetAllReaders)
		readers.GET("/:id", handlers.Reader.GetReader)
		readers.PUT("/:id", handlers.Reader.UpdateReader)
		readers.DELETE("/:id", handlers.Reader.DeleteReader)
	}

	// Выдача и возврат книг (все операции защищены)
	borrow := api.Group("/borrow").Use(authMiddleware)
	{
		borrow.POST("", handlers.Borrow.BorrowBook)
		borrow.POST("/return", handlers.Borrow.ReturnBook)
		borrow.GET("/reader/:reader_id", handlers.Borrow.GetBorrowedBooks)
	}

	// Здоровье API
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "OK",
			"service": "library-api",
		})
	})

	return router
}
