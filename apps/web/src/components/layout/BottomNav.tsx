import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, Wrench, Dices } from 'lucide-react';

const NAV_LINKS = [
  { id: '/fichas', icon: <FileText size={20} />, label: 'Fichas' },
  { id: '/templates', icon: <FolderOpen size={20} />, label: 'Modelos' },
  { id: '/builder', icon: <Wrench size={20} />, label: 'Builder' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-panel border-t border-border z-[100] flex">
      {NAV_LINKS.map(l => (
        <button
          key={l.id}
          onClick={() => navigate(l.id)}
          className={
            'flex-1 flex flex-col items-center justify-center gap-1 ' +
            'text-[10px] font-bold uppercase tracking-[0.05em] cursor-pointer ' +
            'bg-transparent border-none transition-all duration-200 ' +
            (pathname.startsWith(l.id) ? 'text-gold' : 'text-text-muted')
          }
        >
          <span className="flex items-center justify-center">{l.icon}</span>
          {l.label}
        </button>
      ))}
    </nav>
  );
}
