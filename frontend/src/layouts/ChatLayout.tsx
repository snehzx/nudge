import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import RoomList from "../components/RoomList";

export default function ChatLayout() {
  const username = useAuthStore((s) => s.user?.username);
  const logout = useAuthStore((s) => s.logout);
  const status = useChatStore((s) => s.status);
  const error = useChatStore((s) => s.error);
  const connect = useChatStore((s) => s.connect);
  const disconnect = useChatStore((s) => s.disconnect);

  const navigate = useNavigate();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  async function handleLogout() {
    disconnect();
    await logout();
    navigate("/signin", { replace: true });
  }
  return (
    <div className="p-4 flex flex-col gap-3 max-w-2xl">
      <div className="flex gap-2 items-center text-sm">
        <span>{username}</span>
        <span className="text-gray-500">socket: {status}</span>
        <button className="underline" onClick={handleLogout}>
          logout
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <RoomList />
      <Outlet />
    </div>
  );
}
