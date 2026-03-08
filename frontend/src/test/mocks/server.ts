import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const BASE = 'https://afst-4.onrender.com/api/v1';

export const fakeUser = {
  id: 'user-1', email: 'test@lib.dev', name: 'Test User', role: 'reader',
};
export const fakeBooks = [
  { id: 'book-1', title: 'Clean Code', author: 'Robert Martin', copies_count: 3, publication_year: 2008 },
  { id: 'book-2', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', copies_count: 0, publication_year: 1999 },
];

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'test@lib.dev' && body.password === 'correct') {
      return HttpResponse.json({ token: 'jwt-valid-token', user: fakeUser });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),
  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json({ token: 'jwt-new-token', user: { ...fakeUser, email: body.email } });
  }),
  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth === 'Bearer jwt-valid-token') return HttpResponse.json({ user: fakeUser });
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),
  http.get(`${BASE}/books`, () =>
    HttpResponse.json({ books: fakeBooks, total: fakeBooks.length })
  ),
  http.get(`${BASE}/books/:id`, ({ params }) => {
    const book = fakeBooks.find(b => b.id === params.id);
    return book ? HttpResponse.json(book) : HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),
  http.post(`${BASE}/books`, ({ request }) => {
    if (!request.headers.get('Authorization')) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return HttpResponse.json({ id: 'book-new' }, { status: 201 });
  }),
  http.post(`${BASE}/borrow`, async ({ request }) => {
    const body = await request.json() as { book_id: string };
    if (body.book_id === 'book-2') return HttpResponse.json({ error: 'No copies available' }, { status: 422 });
    return HttpResponse.json({ id: 'loan-1', book_id: body.book_id });
  }),
  http.post(`${BASE}/borrow/return`, () => HttpResponse.json({ message: 'Returned' })),
];

export const server = setupServer(...handlers);
