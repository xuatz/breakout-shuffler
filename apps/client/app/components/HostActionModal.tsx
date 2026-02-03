import { Modal } from './Modal';

interface HostActionModalProps {
  participant: {
    id: string;
    displayName: string;
  };
  isOpen: boolean;
  onNudge: () => void;
  onKick: () => void;
  onMoveToGroup?: (groupId: string) => void;
  availableGroups?: string[];
  currentGroup?: string;
  onClose: () => void;
}

export const HostActionModal: React.FC<HostActionModalProps> = ({
  participant,
  isOpen,
  onNudge,
  onKick,
  onMoveToGroup,
  availableGroups,
  currentGroup,
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
        {onMoveToGroup && availableGroups && availableGroups.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Move to Group:
            </p>
            {availableGroups.map((groupId) => (
              <button
                key={groupId}
                onClick={() => {
                  onMoveToGroup(groupId);
                  onClose();
                }}
                className={`w-full px-4 py-2 rounded transition-colors ${
                  currentGroup === groupId
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-default'
                    : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white'
                }`}
                disabled={currentGroup === groupId}
              >
                Group {Number(groupId) + 1}
                {currentGroup === groupId && ' (Current)'}
              </button>
            ))}
          </div>
        )}
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
