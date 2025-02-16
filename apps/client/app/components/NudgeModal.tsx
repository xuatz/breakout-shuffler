import { useAtom } from 'jotai';
import { nudgesAtom } from '../atoms/nudge';
import { Modal } from './Modal';
import { NudgeList } from './NudgeList';

interface NudgeModalProps {
  isOpen: boolean;
  isWiggling?: boolean;
  onClose: () => void;
}

export function NudgeModal({ isOpen, onClose, isWiggling }: NudgeModalProps) {
  const [nudges] = useAtom(nudgesAtom);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          Nudges
          {nudges.length > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {nudges.length}
            </span>
          )}
        </h2>
      </div>
      <NudgeList isWiggling={isWiggling} />
    </Modal>
  );
}
