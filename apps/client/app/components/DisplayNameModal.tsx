import { useState } from 'react';
import { useCookies } from 'react-cookie';
import { sendSocketMessage } from '~/lib/socket';
import { Modal } from './Modal';

interface DisplayNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisplayNameModal({
  isOpen,
  onClose,
}: DisplayNameModalProps) {
  const [getCookie, setCookie] = useCookies(['_displayName']);
  const [newDisplayName, setNewDisplayName] = useState(getCookie._displayName);

  const handleUpdateName = () => {
    if (!newDisplayName.trim()) return;

    setCookie('_displayName', newDisplayName, {
      path: '/',
      secure: import.meta.env.PROD,
      domain: import.meta.env.PROD ? 'some-other-domain' : '.breakout.local',
      maxAge: 7 * 24 * 60 * 60,
    });

    // Notify other clients
    sendSocketMessage('updateDisplayName', {
      displayName: newDisplayName,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Display Name">
      <input
        type="text"
        value={newDisplayName}
        onChange={(e) => setNewDisplayName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter new display name"
      />
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateName}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 
                    dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        >
          Update
        </button>
      </div>
    </Modal>
  );
}
