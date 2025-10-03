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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setNewDisplayName(displayName);
  }, [displayName]);

  const onClickUpdate = async () => {
    if (!newDisplayName.trim()) return;

    setIsLoading(true);
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
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update display name');
      }

      setDisplayName(newDisplayName);
      onClose();
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setIsLoading(false);
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
        disabled={isLoading}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Enter new display name"
      />
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={onClickCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded
                    disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onClickUpdate}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 
                    dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </>
          ) : (
            'Update'
          )}
        </button>
      </div>
    </Modal>
  );
}
