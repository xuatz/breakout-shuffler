import { useEffect, useRef, useState, useCallback } from 'react';
import { useNudgesListener } from '../atoms/nudgeWithListener';
import { useCookies } from 'react-cookie';
import { DisplayNameModal } from './DisplayNameModal';
import { NudgeModal } from './NudgeModal';
import { displayNameAtom } from '~/atoms/displayName';
import { useAtom } from 'jotai';

interface MenuOption {
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}

export function TopBar() {
  const [cookies, setCookie, removeCookie] = useCookies(['_bsid', '_debug']);
  const [userInitial, setUserInitial] = useState('?');
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLButtonElement>(null);
  const [isWiggling, setIsWiggling] = useState(false);
  const isHost =
    typeof window !== 'undefined' && window.location.pathname === '/host';
  const [displayName] = useAtom(displayNameAtom);

  useNudgesListener(
    useCallback((get, set, newVal, prevVal) => {
      setIsWiggling(true);
      const timer = setTimeout(() => setIsWiggling(false), 500);
      return () => clearTimeout(timer);
    }, []),
  );

  useEffect(() => {
    setUserInitial(displayName.charAt(0).toUpperCase());
  }, [displayName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userIconRef.current &&
        userIconRef.current.contains(event.target as Node)
      ) {
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

  const handleClearCookies = useCallback(() => {
    removeCookie('_bsid', {
      path: '/',
      secure: import.meta.env.PROD,
      domain: import.meta.env.VITE_COOKIE_DOMAIN || '.breakout.local',
    });
    removeCookie('_debug', {
      path: '/',
      secure: import.meta.env.PROD,
      domain: import.meta.env.VITE_COOKIE_DOMAIN || '.breakout.local',
    });
    setIsMenuOpen(false);
  }, [removeCookie, setIsMenuOpen]);

  const menuOptions: MenuOption[] = [
    ...(isHost
      ? [
          {
            label: 'Nudges',
            onClick: () => {
              setIsNudgeModalOpen(true);
              setIsMenuOpen(false);
            },
          },
        ]
      : []),
    {
      label: 'Change Display Name',
      onClick: () => {
        setIsDisplayNameModalOpen(true);
        setIsMenuOpen(false);
      },
    },
    {
      label: '⚙️ Debug',
      onClick: () => {}, // This is just a section header
    },
    {
      label: `${cookies._debug ? 'Disable' : 'Enable'} Debug Mode`,
      onClick: () => {
        if (cookies._debug) {
          setCookie('_debug', false, {
            path: '/',
            secure: import.meta.env.PROD,
            domain: import.meta.env.VITE_COOKIE_DOMAIN || '.breakout.local',
          });
        } else {
          setCookie('_debug', true, {
            path: '/',
            secure: import.meta.env.PROD,
            domain: import.meta.env.VITE_COOKIE_DOMAIN || '.breakout.local',
          });
        }
        setIsMenuOpen(false);
      },
    },
    {
      label: 'Clear Cookies',
      onClick: handleClearCookies,
      isDanger: true,
    },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex justify-end items-center gap-2 relative">
        <button
          ref={userIconRef}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`w-8 h-8 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white flex items-center justify-center transition-colors ${
            isWiggling ? 'animate-wiggle' : ''
          }`}
          title="Open menu"
        >
          {userInitial}
        </button>

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          >
            {menuOptions.map((option, index) => {
              return option.onClick === undefined ? (
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
              );
            })}
          </div>
        )}
      </div>

      <DisplayNameModal
        isOpen={isDisplayNameModalOpen}
        onClose={() => setIsDisplayNameModalOpen(false)}
      />

      <NudgeModal
        isOpen={isNudgeModalOpen}
        isWiggling={isWiggling}
        onClose={() => setIsNudgeModalOpen(false)}
      />
    </div>
  );
}
