import { NavLink } from "react-router-dom";
import { useChatStore } from "../store/chatStore";

export default function RoomList() {
  const rooms = useChatStore((s) => s.rooms);

  return (
    <div className="flex gap-1 flex-wrap">
      {rooms.map((r) => (
        <NavLink
          key={r.name}
          to={`/room/${r.name}`}
          className={({ isActive }) =>
            `border px-2 ${isActive ? "bg-gray-200" : ""}`
          }
        >
          {r.name} ({r.members})
        </NavLink>
      ))}
    </div>
  );
}
