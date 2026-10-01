import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search,
  FileText,
  AlertTriangle,
  Compass,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Tag } from '../../../components/ui/Tag';
import {
  TemplateCard,
  type TemplateData,
} from '../components/TemplateCard';
import { TemplateDetailDrawer } from '../components/TemplateDetailDrawer';
import { fetchTemplates } from '../services/templatesApi';
import { DEFAULT_SYSTEMS, SYSTEM_LABELS } from '../types/template-structure';
import type { TemplateSummary } from '../types/templates';
import { useDebounce } from '../hooks/useDebounce';
import { useForkTemplate } from '../hooks/useForkTemplate';
import { useDeleteTemplate } from '../hooks/useDeleteTemplate';

type HubTab = 'gallery' | 'mine';

const PAGE_SIZE = 12;

const TAB_OPTIONS: { id: HubTab; label: string }[] = [
  { id: 'gallery', label: 'Community Gallery' },
  { id: 'mine', label: 'My Templates' },
];

function toTemplateData(t: TemplateSummary): TemplateData {
  return {
    id: t.id,
    name: t.name,
    desc: t.description || 'No description provided.',
    iconNode: <FileText size={32} />,
    official: t.isOfficial,
    creator: t.author?.name || 'Unknown',
    tags: t.tags.map((tag) => tag.name),
    system: t.system,
  };
}

export function TemplatesHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<HubTab>('gallery');
  const [search, setSearch] = useState('');
  const [system, setSystem] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [drawerTemplate, setDrawerTemplate] = useState<TemplateSummary | null>(
    null,
  );

  const debouncedSearch = useDebounce(search, 350);
  const forkMutation = useForkTemplate();
  const deleteMutation = useDeleteTemplate();

  const scope: 'public' | 'mine' = tab === 'gallery' ? 'public' : 'mine';

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      'templates',
      { scope, search: debouncedSearch, system, tags: selectedTags, page },
    ],
    queryFn: () =>
      fetchTemplates({
        scope,
        search: debouncedSearch || undefined,
        system: system || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const templates = data?.data ?? [];
  const meta = data?.meta;

  const tagCloud = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of data?.data ?? []) {
      for (const tag of t.tags) {
        counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  const changeTab = (next: HubTab) => {
    setTab(next);
    setPage(1);
    setSelectedTags([]);
    setDrawerTemplate(null);
  };

  const toggleTag = (name: string) => {
    setPage(1);
    setSelectedTags((prev) =>
      prev.includes(name)
        ? prev.filter((t) => t !== name)
        : [...prev, name],
    );
  };

  const handleDelete = (t: TemplateSummary) => {
    const confirmed = window.confirm(
      `Delete template "${t.name}"? This action cannot be undone.`,
    );
    if (confirmed) {
      deleteMutation.mutate(t.id);
      if (drawerTemplate?.id === t.id) {
        setDrawerTemplate(null);
      }
    }
  };

  const handleUse = (t: TemplateSummary) => {
    toast.info(`Character sheet from "${t.name}" — sheet creation coming soon`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <PageHeader
        title="Templates Hub"
        subtitle={
          tab === 'gallery'
            ? 'Discover community templates for your next adventure'
            : 'Your private templates — edit, duplicate and manage'
        }
      >
        <Button
          variant="gold"
          size="sm"
          onClick={() => navigate('/templates/builder')}
        >
          <Sparkles size={14} /> + Create Template
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {TAB_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => changeTab(option.id)}
            className={`relative px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer ${
              tab === option.id
                ? 'text-gold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            {option.label}
            {tab === option.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gold rounded-full" />
            )}
          </button>
        ))}
        {isFetching && !isLoading && (
          <span className="ml-auto text-[11px] text-text-muted animate-pulse">
            Loading…
          </span>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-5 items-start md:items-center">
        <div className="w-full md:w-80">
          <Input
            icon={<Search size={16} />}
            placeholder="Search templates…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="relative">
          <select
            aria-label="Filter by system"
            value={system}
            onChange={(e) => {
              setSystem(e.target.value);
              setPage(1);
            }}
            className="h-[38px] min-w-[180px] appearance-none cursor-pointer rounded-card border border-border bg-bg-panel px-3 pr-8 text-[13px] text-text-main outline-none transition-all duration-200 focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
          >
            <option value="">All systems</option>
            {DEFAULT_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {SYSTEM_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>

        {tagCloud.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tagCloud.map(({ name, count }) => (
              <Tag
                key={name}
                active={selectedTags.includes(name)}
                onClick={() => toggleTag(name)}
              >
                {name} · {count}
              </Tag>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-gold border-t-transparent animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-danger/50 rounded-card bg-bg-panel/50">
          <AlertTriangle size={48} className="text-danger mb-4 animate-pulse" />
          <h3 className="font-display font-bold text-lg text-danger mb-1">
            Failed to load templates
          </h3>
          <p className="text-sm text-text-muted">
            Could not connect to the server.
          </p>
        </div>
      ) : templates.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                tmpl={toTemplateData(t)}
                mode={tab}
                onUse={() => handleUse(t)}
                onDetail={() => setDrawerTemplate(t)}
                onFork={() => forkMutation.mutate(t.id)}
                onEdit={() => navigate(`/templates/builder/${t.id}`)}
                onDelete={() => handleDelete(t)}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} /> Previous
              </Button>
              <span className="text-[12px] text-text-muted">
                Page {meta.page} of {meta.totalPages} · {meta.total}{' '}
                template{meta.total !== 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-card bg-bg-panel/50">
          <Compass size={48} className="text-gold/50 mb-4 animate-pulse" />
          <h3 className="font-display font-bold text-lg text-text-main mb-1">
            No templates found
          </h3>
          <p className="text-sm text-text-muted">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {drawerTemplate && (
        <TemplateDetailDrawer
          template={drawerTemplate}
          onClose={() => setDrawerTemplate(null)}
        />
      )}
    </div>
  );
}