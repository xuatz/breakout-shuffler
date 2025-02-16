import { useAtom } from 'jotai';
import { twMerge } from 'tailwind-merge';
import { nudgesAtom } from '../atoms/nudgeWithListener';
import { sendSocketMessage } from '~/lib/socket';

export function NudgeList({ isWiggling }: { isWiggling?: boolean }) {
  const [nudges] = useAtom(nudgesAtom);

  const handleClearAll = () => {
    sendSocketMessage('clearNudges');
  };

  // Sort nudges by most recent
  const sortedNudges = [...nudges].sort(
    (a, b) => new Date(b.lastNudge).getTime() - new Date(a.lastNudge).getTime()
  );

  return (
    <div className="w-full">
      {sortedNudges.length > 0 ? (
        <>
          <div className="max-h-60 overflow-y-auto">
            {sortedNudges.map((nudge, index) => (
              <div
                key={nudge.userId}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
              >
                <span
                  className={twMerge(
                    'text-gray-700 dark:text-gray-300',
                    index === 0 && 'font-bold'
                  )}
                >
                  {nudge.displayName}
                </span>
                <span
                  className={twMerge(
                    'text-gray-500 dark:text-gray-400 text-sm',
                    index === 0 && isWiggling && 'animate-wiggle'
                  )}
                >
                  {nudge.count} nudge{nudge.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleClearAll}
            className="w-full mt-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-left"
          >
            Clear All
          </button>
        </>
      ) : (
        <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
          No nudges yet
        </div>
      )}
    </div>
  );
}
