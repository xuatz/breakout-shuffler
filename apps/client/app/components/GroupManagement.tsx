import { useState } from 'react';
import type { User } from '../types';
import { DisplayName } from './DisplayName';
import { HostActionModal } from './HostActionModal';
import { sendSocketMessage } from '~/lib/socket';

interface GroupManagementProps {
  roomId: string;
  groups: { [groupId: string]: string[] };
  participants: User[];
  currentUserId: string;
}

export function GroupManagement({
  roomId,
  groups,
  participants,
  currentUserId,
}: GroupManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create a map of userId to User object for quick lookup
  const userMap = new Map(participants.map((user) => [user.id, user]));

  // Find which group a user is in
  const getUserGroup = (userId: string): string | undefined => {
    for (const groupId in groups) {
      if (groups[groupId].includes(userId)) {
        return groupId;
      }
    }
    return undefined;
  };

  // Get unassigned participants (not in any group)
  const unassignedParticipants = participants.filter(
    (user) => !getUserGroup(user.id),
  );

  const handleUserClick = (user: User) => {
    if (user.id !== currentUserId) {
      setSelectedUser(user);
      setIsModalOpen(true);
    }
  };

  const handleMoveToGroup = (groupId: string) => {
    if (selectedUser) {
      sendSocketMessage('moveUserToGroup', {
        roomId,
        userId: selectedUser.id,
        targetGroupId: groupId,
      });
    }
  };

  const handleNudgeUser = () => {
    if (selectedUser) {
      // TODO: Implement nudge user socket event - tracked in separate issue
      console.log('Nudging user:', selectedUser.id);
    }
  };

  const handleKickUser = () => {
    if (selectedUser) {
      sendSocketMessage('kickUser', {
        roomId,
        targetUserId: selectedUser.id,
      });
    }
  };

  const availableGroups = Object.keys(groups);
  const currentGroup = selectedUser ? getUserGroup(selectedUser.id) : undefined;

  return (
    <div className="w-full space-y-4">
      {unassignedParticipants.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
            Unassigned ({unassignedParticipants.length})
          </h3>
          <ol className="space-y-2">
            {unassignedParticipants.map((user) => (
              <li
                key={user.id}
                className={`bg-white dark:bg-gray-800 rounded-md shadow-sm transition-shadow duration-200 text-gray-700 dark:text-gray-300 ${
                  user.id !== currentUserId
                    ? 'hover:shadow-md cursor-pointer'
                    : ''
                }`}
                onClick={() => handleUserClick(user)}
              >
                <DisplayName user={user} isHost={true} />
              </li>
            ))}
          </ol>
        </div>
      )}

      {Object.keys(groups)
        .sort((a, b) => Number(a) - Number(b))
        .map((groupId) => {
          const groupUsers = groups[groupId]
            .map((userId) => userMap.get(userId))
            .filter((user): user is User => user !== undefined);

          return (
            <div
              key={groupId}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4"
            >
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                Group {Number(groupId) + 1} ({groupUsers.length})
              </h3>
              <ol className="space-y-2">
                {groupUsers.map((user) => (
                  <li
                    key={user.id}
                    className={`bg-white dark:bg-gray-800 rounded-md shadow-sm transition-shadow duration-200 text-gray-700 dark:text-gray-300 ${
                      user.id !== currentUserId
                        ? 'hover:shadow-md cursor-pointer'
                        : ''
                    }`}
                    onClick={() => handleUserClick(user)}
                  >
                    <DisplayName user={user} isHost={true} />
                  </li>
                ))}
              </ol>
            </div>
          );
        })}

      {selectedUser && (
        <HostActionModal
          isOpen={isModalOpen}
          participant={selectedUser}
          onNudge={handleNudgeUser}
          onKick={handleKickUser}
          onMoveToGroup={handleMoveToGroup}
          availableGroups={availableGroups}
          currentGroup={currentGroup}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
