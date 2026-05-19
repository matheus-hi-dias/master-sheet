import React, { useState } from 'react';
import { toast } from 'sonner';
import { Search, FileText, AlertTriangle, Compass } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Tag } from '../../../components/ui/Tag';
import { TemplateCard, type TemplateData } from '../components/TemplateCard';
import { fetchApi } from '../../../lib/api';

const ALL_TAGS = ['Todos', 'D&D', 'Call of Cthulhu', 'Sci-Fi', 'Cyberpunk', 'Fantasia', 'Terror'];

export function TemplatesHub() {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('Todos');

  const { data: templates = [], isLoading, isError } = useQuery<TemplateData[]>({
    queryKey: ['templates', activeTag !== 'Todos' ? activeTag : null],
    queryFn: async () => {
      // Build query string
      const params = new URLSearchParams();
      if (activeTag !== 'Todos') {
        params.append('tags', activeTag);
      }
      const qs = params.toString();
      const endpoint = qs ? `/templates?${qs}` : '/templates';
      const responseData = await fetchApi(endpoint);
      
      return responseData.map((item: any) => ({
        id: item.id,
        name: item.name,
        desc: item.description || 'Nenhuma descrição fornecida.',
        iconNode: <FileText size={32} />,
        official: item.author?.name === 'Master-Sheet' || false, 
        creator: item.author?.name || 'Desconhecido',
        tags: item.tags?.map((t: any) => t.name) || [],
      }));
    },
  });

  const filtered = templates
    .filter((t: TemplateData) => t.name.toLowerCase().includes(search.toLowerCase()) || (t.desc && t.desc.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <PageHeader title="Templates Hub" subtitle="Escolha um sistema para sua próxima aventura">
        <Button variant="gold" size="sm" onClick={() => toast.info('🔧 Acesse o Builder para criar seu modelo!')}>
          + Criar Modelo
        </Button>
      </PageHeader>

      {/* Search + filter bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center">
        <div className="w-full md:w-80">
          <Input 
            icon={<Search size={16} />} 
            placeholder="Buscar sistema…" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map(t => (
            <Tag 
              key={t} 
              active={activeTag === t} 
              onClick={() => setActiveTag(t)}
            >
              {t}
            </Tag>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-gold border-t-transparent animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-danger/50 rounded-card bg-bg-panel/50">
          <AlertTriangle size={48} className="text-danger mb-4 animate-pulse" />
          <h3 className="font-display font-bold text-lg text-danger mb-1">Erro ao carregar templates</h3>
          <p className="text-sm text-text-muted">Não foi possível conectar com o servidor.</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((t: TemplateData) => (
            <TemplateCard
              key={t.id}
              tmpl={t}
              onUse={() => toast.success(`Ficha baseada em ${t.name} criada com sucesso!`)}
              onDetail={() => toast.info(`Abrindo detalhes de ${t.name}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-card bg-bg-panel/50">
          <Compass size={48} className="text-gold/50 mb-4 animate-pulse" />
          <h3 className="font-display font-bold text-lg text-text-main mb-1">Nenhum template encontrado</h3>
          <p className="text-sm text-text-muted">Tente ajustar seus filtros ou termos de busca.</p>
        </div>
      )}
    </div>
  );
}
