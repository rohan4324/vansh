import { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import type { InstallInstructions } from '@/shared/hooks/useInstallPrompt';

interface Props {
  open: boolean;
  instructions: InstallInstructions;
  onClose: () => void;
}

export function InstallInstructionsDialog({ open, instructions, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-xl bg-card shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">{instructions.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4">
          <ol className="space-y-3">
            {instructions.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            Installing Vansh adds it to your home screen or dock for quick access and offline use.
          </p>
        </div>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
