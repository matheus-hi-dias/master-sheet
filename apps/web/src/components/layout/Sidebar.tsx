import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { GemLogo } from '../ui/GemLogo';
import { LogOut, Sun, Moon, FileText, FolderOpen, Wrench } from 'lucide-react';

const NAV_LINKS = [
  { id: '/fichas', icon: <FileText size={18} />, label: 'Fichas' },
  { id: '/templates', icon: <FolderOpen size={18} />, label: 'Modelos' },
  { id: '/templates/builder', icon: <Wrench size={18} />, label: 'Builder' },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const logout = useAuthStore(s => s.logout);

  const activeMatch = NAV_LINKS.reduce<string | null>((best, link) => {
    const matches =
      pathname === link.id || pathname.startsWith(`${link.id}/`);
    if (matches && link.id.length > (best?.length ?? 0)) return link.id;
    return best;
  }, null);

  const isSystemLight =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  const isCurrentlyLight =
    theme === 'light' || (theme === 'system' && isSystemLight);

  const toggleTheme = () => {
    setTheme(isCurrentlyLight ? 'dark' : 'light');
  };

  const getThemeIcon = () => {
    return isCurrentlyLight ? <Sun size={16} /> : <Moon size={16} />;
  };

  const getThemeTitle = () => {
    if (theme === 'system')
      return `Tema atual: ${isCurrentlyLight ? 'Claro' : 'Escuro'} (Sistema)`;
    return `Tema atual: ${theme === 'light' ? 'Claro' : 'Escuro'}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = 'M';
  const userName = 'Aventureiro';

  return (
    <nav className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-[220px] bg-bg-panel border-r border-border z-[100]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <GemLogo size={32} />
        <p className="font-display font-black text-[18px] text-gold tracking-[0.08em] mt-2 leading-none">
          Master-Sheet
        </p>
        <p className="text-[10px] text-text-muted tracking-[0.2em] uppercase mt-1">
          RPG Platform
        </p>
      </div>

      {/* Links */}
      <div className="flex-1 flex flex-col gap-1 px-3 py-4">
        {NAV_LINKS.map(l => (
          <button
            key={l.id}
            onClick={() => navigate(l.id)}
            className={
              'flex items-center gap-2.5 px-3 py-2.5 rounded-card ' +
              'text-[13px] font-bold uppercase tracking-[0.05em] border transition-all duration-200 ' +
              'cursor-pointer ' +
              (activeMatch === l.id
                ? 'text-gold bg-[rgba(212,175,55,0.08)] border-[rgba(212,175,55,0.2)]'
                : 'text-text-muted border-transparent hover:text-text-main hover:bg-bg-card')
            }
          >
            <span className="flex items-center justify-center">{l.icon}</span>
            {l.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      <div className="flex flex-col px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-gold-dim to-gold border-2 border-gold flex items-center justify-center font-display font-bold text-[14px] text-[#121212] shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-text-main truncate">
              {userName}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.1em] truncate">
              Player
            </p>
          </div>
          <button
            onClick={toggleTheme}
            title={getThemeTitle()}
            className="bg-transparent border border-border rounded-card px-2 py-1.5 text-text-muted text-sm cursor-pointer transition-all duration-200 hover:text-gold hover:border-gold flex items-center justify-center"
          >
            {getThemeIcon()}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 flex items-center justify-center gap-2 w-full py-1.5 px-2 bg-transparent border border-border rounded-card text-text-muted text-[11px] font-bold uppercase tracking-[0.05em] cursor-pointer transition-all duration-200 hover:text-danger hover:border-danger hover:bg-danger/10"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </nav>
  );
}
