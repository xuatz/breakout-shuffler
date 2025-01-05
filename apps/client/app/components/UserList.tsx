import type { User } from '../routes/+types/room';

interface UserListProps {
  users?: User[];
  title?: string;
}

export function UserList({ users, title = 'Participants' }: UserListProps) {
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
        {title} ({users?.length || 0})
      </h3>
      <ol className="space-y-2">
        {users?.map((user, index) => (
          <li
            key={user.id || index}
            className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-700 dark:text-gray-300"
          >
            <span className="mr-2">•</span>
            <span>{user.name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
