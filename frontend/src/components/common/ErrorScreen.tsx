type ErrorScreenProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

function ErrorScreen({ title, message, actionLabel, onAction }: ErrorScreenProps) {
  return (
    <div className="screen-state">
      <h2>{title || 'Что-то пошло не так'}</h2>
      {message && <p>{message}</p>}
      {actionLabel && onAction && (
        <button className="primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorScreen;
