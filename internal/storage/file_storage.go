package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type FileStorage interface {
	Upload(file multipart.File, header *multipart.FileHeader) (*UploadResult, error)
	Get(filePath string) (*os.File, error)
	Delete(filePath string) error
	Exists(filePath string) bool
	GetURL(filePath string) string
}

type UploadResult struct {
	FileName     string
	OriginalName string
	FilePath     string
	FileSize     int64
	MimeType     string
	Hash         string
}

type LocalStorage struct {
	BasePath string
	BaseURL  string
}

func NewLocalStorage(basePath, baseURL string) *LocalStorage {
	if err := os.MkdirAll(basePath, 0755); err != nil {
		panic(fmt.Sprintf("failed to create storage directory: %v", err))
	}
	return &LocalStorage{
		BasePath: basePath,
		BaseURL:  baseURL,
	}
}

func (s *LocalStorage) Upload(file multipart.File, header *multipart.FileHeader) (*UploadResult, error) {
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExts := map[string]bool{".pdf": true, ".epub": true, ".mobi": true}
	if !allowedExts[ext] {
		return nil, fmt.Errorf("unsupported file type: %s", ext)
	}

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return nil, fmt.Errorf("failed to calculate hash: %w", err)
	}
	hashStr := hex.EncodeToString(hash.Sum(nil))

	if _, err := file.Seek(0, 0); err != nil {
		return nil, fmt.Errorf("failed to seek file: %w", err)
	}

	fileName := fmt.Sprintf("%s_%s%s", uuid.New().String(), hashStr[:8], ext)
	subDir := hashStr[:2]
	dirPath := filepath.Join(s.BasePath, subDir)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	filePath := filepath.Join(subDir, fileName)
	fullPath := filepath.Join(s.BasePath, filePath)

	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	size, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(fullPath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	mimeType := "application/octet-stream"
	switch ext {
	case ".pdf":
		mimeType = "application/pdf"
	case ".epub":
		mimeType = "application/epub+zip"
	case ".mobi":
		mimeType = "application/x-mobipocket-ebook"
	}

	return &UploadResult{
		FileName:     fileName,
		OriginalName: header.Filename,
		FilePath:     filePath,
		FileSize:     size,
		MimeType:     mimeType,
		Hash:         hashStr,
	}, nil
}

func (s *LocalStorage) Get(filePath string) (*os.File, error) {
	fullPath := filepath.Join(s.BasePath, filePath)
	return os.Open(fullPath)
}

func (s *LocalStorage) Delete(filePath string) error {
	fullPath := filepath.Join(s.BasePath, filePath)
	return os.Remove(fullPath)
}

func (s *LocalStorage) Exists(filePath string) bool {
	fullPath := filepath.Join(s.BasePath, filePath)
	_, err := os.Stat(fullPath)
	return err == nil
}

func (s *LocalStorage) GetURL(filePath string) string {
	return fmt.Sprintf("%s/files/%s", s.BaseURL, filePath)
}
