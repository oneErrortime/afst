import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileWithPreview extends File {
  preview?: string;
}

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  uploading?: boolean;
  className?: string;
}

const FILE_TYPES: Record<string, { label: string; color: string }> = {
  'application/pdf': { label: 'PDF', color: 'bg-red-100 text-red-600' },
  'application/epub+zip': { label: 'EPUB', color: 'bg-blue-100 text-blue-600' },
  'application/x-mobipocket-ebook': { label: 'MOBI', color: 'bg-green-100 text-green-600' },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeFromName(name: string): string {
  const ext = name.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'epub': return 'application/epub+zip';
    case 'mobi': return 'application/x-mobipocket-ebook';
    default: return 'application/octet-stream';
  }
}

export function DropZone({
  onFilesSelected,
  accept = '.pdf,.epub,.mobi',
  multiple = true,
  maxSize = 100 * 1024 * 1024,
  maxFiles = 10,
  disabled = false,
  uploading = false,
  className = '',
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = accept.split(',').map(t => t.trim().replace('.', ''));
    const fileExt = file.name.toLowerCase().split('.').pop();
    
    if (!allowedTypes.includes(fileExt || '')) {
      return `Файл "${file.name}" имеет неподдерживаемый формат. Разрешены: ${accept}`;
    }
    
    if (file.size > maxSize) {
      return `Файл "${file.name}" слишком большой (${formatFileSize(file.size)}). Максимум: ${formatFileSize(maxSize)}`;
    }
    
    return null;
  }, [accept, maxSize]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileWithPreview[] = [];
    const newErrors: string[] = [];

    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`Максимум ${maxFiles} файлов одновременно`);
      return;
    }

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else if (!files.some(f => f.name === file.name && f.size === file.size)) {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);
    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesSelected(validFiles);
    }
  }, [files, maxFiles, validateFile, onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled || uploading) return;

    const { files: droppedFiles } = e.dataTransfer;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [disabled, uploading, handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setErrors([]);
  }, []);

  return (
    <div className={className}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <div className={`transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDragging ? 'bg-primary-100' : 'bg-gray-100'
          }`}>
            <Upload className={`h-8 w-8 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
          </div>
          
          <p className="text-lg font-medium text-gray-700 mb-1">
            {isDragging ? 'Отпустите файлы здесь' : 'Перетащите файлы сюда'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            или нажмите для выбора файлов
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-red-50 text-red-600 rounded">PDF</span>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">EPUB</span>
            <span className="px-2 py-1 bg-green-50 text-green-600 rounded">MOBI</span>
            <span className="text-gray-400">• До {formatFileSize(maxSize)}</span>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Выбрано файлов: {files.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Очистить всё
            </button>
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => {
              const fileType = FILE_TYPES[file.type] || FILE_TYPES[getFileTypeFromName(file.name)] || { label: 'FILE', color: 'bg-gray-100 text-gray-600' };
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <div className={`p-2 rounded-lg ${fileType.color}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {fileType.label} • {formatFileSize(file.size)}
                    </p>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
