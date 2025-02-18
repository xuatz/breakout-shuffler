import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { useEffect } from 'react';
import { useCookies } from 'react-cookie';
import { useAtom } from 'jotai';
import type { Route } from './+types/root';
import { TopBar } from './components/TopBar';
import stylesheet from './app.css?url';
import { socket } from './lib/socket';
import { nudgesAtom } from './atoms/nudgeWithListener';
import { displayNameAtom } from './atoms/displayName';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'stylesheet', href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <TopBar />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [cookies, setCookie] = useCookies(['_bsid']);
  const [, setNudges] = useAtom(nudgesAtom);
  const [, setDisplayName] = useAtom(displayNameAtom);

  const isHost =
    typeof window !== 'undefined' && window.location.pathname === '/host';

  useEffect(() => {
    const uniqueId = import.meta.env.PROD
      ? crypto.randomUUID()
      : (() => {
          const array = new Uint32Array(4);
          window.crypto.getRandomValues(array);
          return array.join('-');
        })();
    const cookieOptions = {
      path: '/',
      secure: import.meta.env.PROD,
      domain: import.meta.env.VITE_COOKIE_DOMAIN || '.breakout.local',
      maxAge: 7 * 24 * 60 * 60,
    };

    if (!cookies._bsid) {
      setCookie('_bsid', uniqueId, cookieOptions);
    }

    const fetchDisplayName = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/me/displayName`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch display name');
        }

        const { displayName } = await response.json();
        setDisplayName(displayName);
      } catch (error) {
        console.error('Error fetching display name:', error);
      }
    };

    fetchDisplayName();
    socket.connect();

    // Set up socket event listeners
    const handleHostNudged = ({ nudges }: { nudges: any[] }) => {
      if (!isHost) {
        return;
      }

      setNudges(
        nudges.map((nudge: any) => ({
          ...nudge,
          lastNudge: new Date(nudge.lastNudge),
        }))
      );
    };

    socket.on('hostNudged', handleHostNudged);

    return () => {
      socket.off('hostNudged', handleHostNudged);
    };
  }, [cookies._bsid, setCookie, setNudges, setDisplayName, isHost]);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
