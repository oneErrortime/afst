type LoadingScreenProps = {
  message?: string;
};

function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="screen-state">
      <div className="spinner" />
      <p>{message || 'Подождите...'}</p>
    </div>
  );
}

export default LoadingScreen;
