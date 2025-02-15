import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { sendSocketMessage } from '~/lib/socket';

export function TopBar() {
  const [cookies, setCookie] = useCookies(['_displayName']);
  const [userInitial, setUserInitial] = useState('?');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');

  useEffect(() => {
    if (cookies._displayName) {
      setUserInitial(cookies._displayName.charAt(0).toUpperCase());
    }
  }, [cookies._displayName]);

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

    setIsDialogOpen(false);
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setNewDisplayName(cookies._displayName);
            setIsDialogOpen(true);
          }}
          className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
          title="Change display name"
        >
          {userInitial}
        </button>
      </div>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Change Display Name
            </h2>
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
                onClick={() => setIsDialogOpen(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}
