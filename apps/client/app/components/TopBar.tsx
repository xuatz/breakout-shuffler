import { useEffect, useRef, useState } from 'react';
import { useCookies } from 'react-cookie';
import { sendSocketMessage } from '~/lib/socket';

interface MenuOption {
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}

export function TopBar() {
  const [cookies, setCookie, removeCookie] = useCookies([
    '_bsid',
    '_displayName',
  ]);
  const [userInitial, setUserInitial] = useState('?');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cookies._displayName) {
      setUserInitial(cookies._displayName.charAt(0).toUpperCase());
    }
  }, [cookies._displayName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userIconRef.current && userIconRef.current.contains(event.target as Node)) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        return;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleClearCookies = () => {
    removeCookie('_bsid', {
      path: '/',
      secure: import.meta.env.PROD,
      domain: import.meta.env.VITE_COOKIE_DOMAIN || '.breakout.local',
    });
    removeCookie('_displayName', {
      path: '/',
      secure: import.meta.env.PROD,
      domain: import.meta.env.VITE_COOKIE_DOMAIN || '.breakout.local',
    });
    setIsMenuOpen(false);
  };

  const menuOptions: MenuOption[] = [
    {
      label: 'Change Display Name',
      onClick: () => {
        setNewDisplayName(cookies._displayName);
        setIsDialogOpen(true);
        setIsMenuOpen(false);
      },
    },
    {
      label: '⚙️ Debug',
      onClick: () => {}, // This is just a section header
    },
    {
      label: 'Clear Cookies',
      onClick: handleClearCookies,
      isDanger: true,
    },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex justify-end relative">
        <button
          ref={userIconRef}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
          title="Open menu"
        >
          {userInitial}
        </button>

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          >
            {menuOptions.map((option, index) =>
              option.onClick === undefined ? (
                <div
                  key={index}
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 font-semibold bg-gray-50 dark:bg-gray-700"
                >
                  {option.label}
                </div>
              ) : (
                <button
                  key={index}
                  onClick={option.onClick}
                  className={`w-full text-left px-4 py-2 text-sm
                    ${
                      option.isDanger
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {option.label}
                </button>
              )
            )}
          </div>
        )}
      </div>

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
