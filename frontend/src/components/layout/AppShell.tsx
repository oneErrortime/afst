import { ReactNode } from 'react';
import { useSessionStore } from '../../store/sessionStore';

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const user = useSessionStore((state) => state.user);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="topbar-actions">
          {actions}
          <div className="avatar-chip">
            <span>{user?.name?.[0]?.toUpperCase() || 'A'}</span>
            <div>
              <strong>{user?.name || 'Admin'}</strong>
              <p>{user?.email || '—'}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="shell-body">{children}</div>
    </div>
  );
}

export default AppShell;
