import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { CHANGELOG } from '../constants/changelog';

interface WhatsNewModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onDismiss }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDismiss(); }}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <DialogTitle className="text-lg">Yang Baru di Aplikasi</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2 max-h-80 overflow-y-auto pr-1">
          {CHANGELOG.map((entry, i) => (
            <div key={entry.version}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                  v{entry.version}
                </span>
                <span className="text-xs text-gray-400">{entry.date}</span>
                {i === 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Terbaru
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {entry.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Button
          onClick={onDismiss}
          className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl mt-2"
        >
          Oke, Mengerti!
        </Button>
      </DialogContent>
    </Dialog>
  );
};
