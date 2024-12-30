import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Chat from '~/components/Chat';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <h1 className="text-4xl font-bold mt-8">Welcome to Breakout Shuffler</h1>
      <Chat />
      {/* <Welcome /> */}
    </div>
  );
}
