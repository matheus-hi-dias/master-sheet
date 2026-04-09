import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { Button } from '../../../components/ui/Button';

export function Dashboard() {
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-main)] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-2 font-display text-[var(--color-gold)]">Dashboard (Minhas Fichas)</h1>
      <p className="mb-8 text-[var(--color-text-muted)] tracking-widest text-xs uppercase">Conectado na plataforma</p>
      
      <div className="flex gap-2 mb-8 bg-[var(--color-bg-card)] p-3 rounded-lg border border-[var(--color-border)]">
        <Button variant={theme === 'light' ? 'gold' : 'ghost'} onClick={() => setTheme('light')}>Tema Claro</Button>
        <Button variant={theme === 'dark' ? 'gold' : 'ghost'} onClick={() => setTheme('dark')}>Tema Escuro</Button>
        <Button variant={theme === 'system' ? 'gold' : 'ghost'} onClick={() => setTheme('system')}>Sistema</Button>
      </div>

      <Button onClick={logout} variant="outline">
        Desconectar Identidade
      </Button>
    </div>
  );
}
