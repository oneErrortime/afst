import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi, booksApi, type Collection, type Book, type CreateCollectionDTO, type UpdateCollectionDTO } from '@/api/wrapper';
import { Button, Input, Modal, Loading } from '@/components/ui';
import { Plus, Edit, Trash2, BookOpen, GripVertical, ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import { toast } from '@/components/ui';

interface CollectionWithBooks extends Collection {
  books?: Book[];
  isExpanded?: boolean;
}

export function Collections() {
  const [collections, setCollections] = useState<CollectionWithBooks[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [bookSearch, setBookSearch] = useState('');
  const [draggedBook, setDraggedBook] = useState<{ book: Book; fromCollectionId: string } | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      const [collectionsData, booksData] = await Promise.all([
        collectionsApi.getMyCollections(),
        booksApi.getAll({ limit: 100 })
      ]);
      
      const collectionsWithExpanded = (collectionsData || []).map((c: Collection) => ({
        ...c,
        isExpanded: false
      }));
      
      setCollections(collectionsWithExpanded);
      setAllBooks(booksData || []);
    } catch {
      toast.error('Ошибка загрузки коллекций');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const toggleExpand = async (collectionId: string) => {
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        return { ...c, isExpanded: !c.isExpanded };
      }
      return c;
    }));
    
    const collection = collections.find(c => c.id === collectionId);
    if (collection && !collection.books) {
      try {
        const fullCollection = await collectionsApi.getById(collectionId);
        setCollections(prev => prev.map(c => {
          if (c.id === collectionId) {
            return { ...c, books: (fullCollection as any)?.books || [] };
          }
          return c;
        }));
      } catch {
        console.error('Failed to load collection books');
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Введите название');
      return;
    }
    
    try {
      if (editingCollection) {
        await collectionsApi.update(editingCollection.id!, form as UpdateCollectionDTO);
        toast.success('Коллекция обновлена');
      } else {
        await collectionsApi.create(form as CreateCollectionDTO);
        toast.success('Коллекция создана');
      }
      setModalOpen(false);
      fetchCollections();
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить коллекцию?')) return;
    
    try {
      await collectionsApi.delete(id);
      toast.success('Коллекция удалена');
      fetchCollections();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handleRemoveBook = async (collectionId: string, bookId: string) => {
    try {
      await collectionsApi.removeBook(collectionId, bookId);
      setCollections(prev => prev.map(c => {
        if (c.id === collectionId) {
          return { ...c, books: c.books?.filter(b => b.id !== bookId) };
        }
        return c;
      }));
      toast.success('Книга удалена из коллекции');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handleAddBook = async (bookId: string) => {
    if (!selectedCollectionId) return;
    
    try {
      await collectionsApi.addBook(selectedCollectionId, bookId);
      const fullCollection = await collectionsApi.getById(selectedCollectionId);
      setCollections(prev => prev.map(c => {
        if (c.id === selectedCollectionId) {
          return { ...c, books: (fullCollection as any)?.books || [] };
        }
        return c;
      }));
      toast.success('Книга добавлена');
      setAddBookModalOpen(false);
    } catch {
      toast.error('Книга уже в коллекции или ошибка');
    }
  };

  const openModal = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setForm({ name: collection.name || '', description: collection.description || '' });
    } else {
      setEditingCollection(null);
      setForm({ name: '', description: '' });
    }
    setModalOpen(true);
  };

  const openAddBookModal = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setBookSearch('');
    setAddBookModalOpen(true);
  };

  const handleDragStart = (book: Book, collectionId: string) => {
    setDraggedBook({ book, fromCollectionId: collectionId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetCollectionId: string) => {
    if (!draggedBook) return;
    
    if (draggedBook.fromCollectionId === targetCollectionId) {
      setDraggedBook(null);
      return;
    }

    try {
      await collectionsApi.addBook(targetCollectionId, draggedBook.book.id!);
      await collectionsApi.removeBook(draggedBook.fromCollectionId, draggedBook.book.id!);
      
      setCollections(prev => prev.map(c => {
        if (c.id === draggedBook.fromCollectionId) {
          return { ...c, books: c.books?.filter(b => b.id !== draggedBook.book.id) };
        }
        if (c.id === targetCollectionId) {
          return { ...c, books: [...(c.books || []), draggedBook.book] };
        }
        return c;
      }));
      
      toast.success('Книга перемещена');
    } catch {
      toast.error('Ошибка перемещения');
    } finally {
      setDraggedBook(null);
    }
  };

  const filteredBooks = allBooks.filter(book => {
    const collection = collections.find(c => c.id === selectedCollectionId);
    const isInCollection = collection?.books?.some(b => b.id === book.id);
    const matchesSearch = !bookSearch || 
      book.title?.toLowerCase().includes(bookSearch.toLowerCase()) ||
      book.author?.toLowerCase().includes(bookSearch.toLowerCase());
    return !isInCollection && matchesSearch;
  });

  if (loading) return <Loading text="Загрузка коллекций..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мои коллекции</h1>
          <p className="text-gray-500 mt-1">Организуйте книги по своему вкусу</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Создать коллекцию
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-4">У вас пока нет коллекций</p>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Создать первую коллекцию
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((collection) => (
            <div 
              key={collection.id} 
              className={`bg-white rounded-xl border transition-all ${
                draggedBook ? 'border-primary-300 border-dashed' : 'border-gray-200'
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(collection.id!)}
            >
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
                onClick={() => toggleExpand(collection.id!)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl">
                    <BookOpen className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{collection.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{collection.books?.length || 0} книг</span>
                      {collection.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{collection.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openAddBookModal(collection.id!); }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openModal(collection); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDelete(collection.id!); }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {collection.isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {collection.isExpanded && (
                <div className="border-t border-gray-100 p-4">
                  {!collection.books || collection.books.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>В этой коллекции пока нет книг</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => openAddBookModal(collection.id!)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить книги
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {collection.books.map((book) => (
                        <div
                          key={book.id}
                          draggable
                          onDragStart={() => handleDragStart(book, collection.id!)}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                          
                          <div className="w-10 h-14 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                            {book.cover_url ? (
                              <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                📖
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <Link to={`/books/${book.id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1">
                              {book.title}
                            </Link>
                            <p className="text-sm text-gray-500 line-clamp-1">{book.author}</p>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveBook(collection.id!, book.id!)}
                            className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCollection ? 'Редактировать коллекцию' : 'Новая коллекция'}>
        <div className="space-y-4">
          <Input
            label="Название"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Моя коллекция"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Необязательное описание..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingCollection ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addBookModalOpen} onClose={() => setAddBookModalOpen(false)} title="Добавить книгу" size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Поиск книги..."
              className="pl-10"
            />
          </div>
          
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {filteredBooks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {bookSearch ? 'Книги не найдены' : 'Все книги уже в коллекции'}
              </p>
            ) : (
              filteredBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleAddBook(book.id!)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left"
                >
                  <div className="w-10 h-14 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <BookOpen className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-1">{book.title}</p>
                    <p className="text-sm text-gray-500">{book.author}</p>
                  </div>
                  <Plus className="h-5 w-5 text-gray-400" />
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
