import { useState } from 'react';
import { ApiConnector } from '../../store/types';
import { useSessionStore } from '../../store/sessionStore';

interface AuthGateProps {
  connector: ApiConnector;
}

function AuthGate({ connector }: AuthGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Admin User');
  const { login, register, status, error } = useSessionStore((state) => ({
    login: state.login,
    register: state.register,
    status: state.status,
    error: state.error
  }));

  const handleSubmit = async () => {
    if (mode === 'login') {
      await login(connector.baseUrl, email, password);
    } else {
      await register(connector.baseUrl, email, password, name);
    }
  };

  return (
    <main className="page">
      <section className="panel highlight">
        <h1>Подключён {connector.name}</h1>
        <p>{connector.baseUrl}</p>
        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Вход
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Регистрация
          </button>
        </div>
      </section>
      <section className="panel">
        <div className="form-grid">
          {mode === 'register' && (
            <label>
              Имя
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <button className="primary" onClick={handleSubmit} disabled={status === 'loading'}>
          {status === 'loading' ? 'Отправляем...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </section>
    </main>
  );
}

export default AuthGate;
