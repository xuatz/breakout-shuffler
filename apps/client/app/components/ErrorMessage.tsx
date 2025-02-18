interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="w-full p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
      {message}
    </div>
  );
}
