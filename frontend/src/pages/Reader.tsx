import { useParams } from 'react-router-dom';

export function Reader() {
  const { bookId } = useParams();

  // TODO: Implement a proper reader component
  // The integration of react-pdf caused issues with the Vite dev server.
  // This needs further investigation.

  return (
    <div>
      <h1>Reader</h1>
      <p>Book ID: {bookId}</p>
      <p>Reading functionality is not yet implemented.</p>
    </div>
  );
}
