import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('rooms/:roomId', 'routes/room.tsx'),
  route('host', 'routes/host.tsx'),
] satisfies RouteConfig;
