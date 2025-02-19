import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { displayNameAtom } from '~/atoms/displayName';
import { Modal } from './Modal';

interface DisplayNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisplayNameModal({ isOpen, onClose }: DisplayNameModalProps) {
  const [displayName, setDisplayName] = useAtom(displayNameAtom);
  const [newDisplayName, setNewDisplayName] = useState(displayName);

  useEffect(() => {
    setNewDisplayName(displayName);
  }, [displayName]);

  const onClickUpdate = async () => {
    if (!newDisplayName.trim()) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/me/displayName`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ displayName: newDisplayName }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update display name');
      }

      setDisplayName(newDisplayName);
      onClose();
    } catch (error) {
      console.error('Error updating display name:', error);
    }
  };

  const onClickCancel = () => {
    setNewDisplayName(displayName);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClickCancel} title="Change Display Name">
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
          onClick={onClickCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          Cancel
        </button>
        <button
          onClick={onClickUpdate}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 
                    dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        >
          Update
        </button>
      </div>
    </Modal>
  );
}
