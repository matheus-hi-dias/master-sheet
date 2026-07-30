import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button } from '../../../components/ui/Button';
import { PageHeader } from '../../../components/ui/PageHeader';

import { FileText } from 'lucide-react';

export function FichasPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <PageHeader
        title="Fichas"
        subtitle={`Bem-vindo(a) de volta, ${user?.name || 'Aventureiro'}! Suas fichas recentes estão aqui.`}
      />

      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-card bg-bg-panel/50">
        <FileText size={48} className="text-gold/50 mb-4 animate-pulse" />
        <h3 className="font-display font-bold text-lg text-text-main mb-1">
          Nenhuma ficha criada ainda
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Comece explorando os templates disponíveis para criar a sua primeira
          ficha.
        </p>

        <Button variant="gold" onClick={() => navigate('/templates')}>
          Explorar Galeria de Templates
        </Button>
      </div>
    </div>
  );
}
