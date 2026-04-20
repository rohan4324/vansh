import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt';
import { InstallInstructionsDialog } from './InstallInstructionsDialog';

export function InstallPrompt() {
  const { shouldShow, canPromptNatively, promptInstall, dismiss, instructions } = useInstallPrompt();
  const [hidden, setHidden] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleDismiss = () => {
    dismiss();
    setHidden(true);
  };

  const handleInstallClick = async () => {
    if (canPromptNatively) {
      await promptInstall();
    } else {
      setShowDialog(true);
    }
  };

  if (!shouldShow || hidden) {
    return (
      <InstallInstructionsDialog
        open={showDialog}
        instructions={instructions}
        onClose={() => setShowDialog(false)}
      />
    );
  }

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg border border-border bg-card p-4 shadow-lg md:bottom-4 md:left-auto md:right-4 md:w-80">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Install Vansh</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {canPromptNatively
                ? 'Install Vansh for quick access to your family tree.'
                : 'Add Vansh to your home screen for quick access.'}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstallClick}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {canPromptNatively ? 'Install' : 'Show how'}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 hover:bg-secondary"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <InstallInstructionsDialog
        open={showDialog}
        instructions={instructions}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}
