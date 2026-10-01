import { useState } from 'react';
import { Check, Copy, Download, TriangleAlert, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { parseTemplateStructure } from '../lib/structureImport';
import type { TemplateStructure } from '../../templates/types/template-structure';

type ModalMode = 'import' | 'export';

interface JsonModalProps {
  mode: ModalMode;
  structure: TemplateStructure;
  onClose: () => void;
  onImport: (structure: TemplateStructure) => void;
}

export function JsonModal({
  mode,
  structure,
  onClose,
  onImport,
}: JsonModalProps) {
  const [text, setText] = useState(() =>
    mode === 'export' ? JSON.stringify(structure, null, 2) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImport = () => {
    const result = parseTemplateStructure(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(result.value);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not access the clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'template-structure.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border border-border rounded-card bg-bg-panel shadow-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <h2 className="text-[13px] font-display font-bold uppercase tracking-[0.14em] text-text-main">
            {mode === 'import' ? 'Import template JSON' : 'Export template JSON'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto p-1.5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          {mode === 'import' ? (
            <p className="text-[12px] text-text-muted mb-3">
              Paste a template DSL export. The structure will replace the current
              tabs, sections and fields.
            </p>
          ) : (
            <p className="text-[12px] text-text-muted mb-3">
              Full template structure as JSON — ready to share or import.
            </p>
          )}

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={18}
            readOnly={mode === 'export'}
            spellCheck={false}
            className={cn(
              'w-full font-mono text-[12px] leading-relaxed bg-bg-card border border-border rounded-card p-3 text-text-main outline-none resize-y focus:border-gold',
              mode === 'export' &&
                'opacity-90 cursor-text select-text',
            )}
          />

          {error && (
            <p className="mt-3 flex items-start gap-2 text-[12px] text-danger">
              <TriangleAlert size={13} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border">
          {mode === 'import' ? (
            <>
              <Button variant="gold" size="sm" onClick={handleImport}>
                Validate & import
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="gold" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download size={14} /> Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}