import { useState } from 'react';
import { ApiConnector } from '../../store/types';
import { useSessionStore } from '../../store/sessionStore';

interface SetupWizardProps {
  connector: ApiConnector;
  onCompleted: () => void;
}

function SetupWizard({ connector, onCompleted }: SetupWizardProps) {
  const [name, setName] = useState('Главный администратор');
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('password123');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState<string>();
  const login = useSessionStore((state) => state.login);

  const handleSubmit = async () => {
    setStatus('loading');
    setError(undefined);
    try {
      const url = `${connector.baseUrl.replace(/\/$/, '')}/setup/create-admin`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Ошибка ${response.status}`);
      }
      await login(connector.baseUrl, email, password);
      setStatus('success');
      onCompleted();
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Не удалось создать администратора');
    }
  };

  return (
    <main className="page">
      <section className="panel highlight">
        <h1>Первичная настройка</h1>
        <p>
          Поддерживаем {connector.baseUrl}. Похоже, администратор ещё не создан. Заполните форму и получите полный доступ к панели
          управления.
        </p>
      </section>
      <section className="panel">
        <div className="form-grid">
          <label>
            Имя
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email (только gmail)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <button className="primary" onClick={handleSubmit} disabled={status === 'loading'}>
          {status === 'loading' ? 'Создаём...' : 'Создать администратора'}
        </button>
      </section>
    </main>
  );
}

export default SetupWizard;
