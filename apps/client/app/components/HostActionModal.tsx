import { Modal } from './Modal';

interface HostActionModalProps {
  participant: {
    id: string;
    displayName: string;
  };
  isOpen: boolean;
  onNudge: () => void;
  onKick: () => void;
  onClose: () => void;
}

export const HostActionModal: React.FC<HostActionModalProps> = ({
  participant,
  isOpen,
  onNudge,
  onKick,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      title={`Actions for ${participant.displayName}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 p-4">
        <button
          onClick={() => {
            onNudge();
            onClose();
          }}
          className="w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded transition-colors"
        >
          Nudge User
        </button>
        <button
          onClick={() => {
            onKick();
            onClose();
          }}
          className="w-full px-4 py-2 text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 rounded transition-colors"
        >
          Kick User
        </button>
      </div>
    </Modal>
  );
};
