import React from 'react';
import { Tag } from '../../../components/ui/Tag';
import { Button } from '../../../components/ui/Button';
import { FileText } from 'lucide-react';

export interface TemplateData {
  id: string;
  name: string;
  desc: string;
  emoji?: string;
  iconNode?: React.ReactNode;
  official: boolean;
  creator: string;
  tags: string[];
}

export interface TemplateCardProps {
  tmpl: TemplateData;
  onUse: () => void;
  onDetail: () => void;
}

export function TemplateCard({ tmpl, onUse, onDetail }: TemplateCardProps) {
  return (
    <div className="bg-bg-panel border border-border rounded-card overflow-hidden transition-all duration-200 hover:border-[rgba(212,175,55,0.4)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-fade-in flex flex-col h-full">
      {/* Icon area */}
      <div className="h-20 flex items-center justify-center relative overflow-hidden bg-[linear-gradient(135deg,rgba(212,175,55,0.05),rgba(212,175,55,0.12))] border-b border-border">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(212,175,55,0.025)_8px,rgba(212,175,55,0.025)_9px)]" />
        <span className="relative z-10 flex items-center justify-center text-gold">
          {tmpl.iconNode || <FileText size={32} />}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="font-display text-[15px] font-bold text-text-main">
          {tmpl.name}
        </p>
        <p className="text-[12px] text-text-muted mt-1 leading-relaxed flex-1">
          {tmpl.desc}
        </p>

        <div className="mt-2.5">
          {tmpl.official ? (
            <span className="inline-flex items-center gap-1 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] text-gold text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded">
              ✦ Oficial
            </span>
          ) : (
            <span className="text-[11px] text-text-muted">por {tmpl.creator}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {tmpl.tags.map(t => (
            <Tag key={t} className="pointer-events-none">{t}</Tag>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 px-4 py-3 border-t border-border">
        <Button variant="gold" size="sm" onClick={onUse} className="flex-1">
          Usar Modelo
        </Button>
        <Button variant="outline" size="sm" onClick={onDetail} className="flex-1">
          Ver Detalhes
        </Button>
      </div>
    </div>
  );
}
