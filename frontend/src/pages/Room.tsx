import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();

  const joined = useChatStore((s) => s.joined);
  const status = useChatStore((s) => s.status);
  const send = useChatStore((s) => s.send);

  useEffect(() => {
    if (!roomId) return;
    if (status !== "open") return;
    if (joined.includes(roomId)) return;

    send({ type: "joinRoom", room: roomId });
  }, [roomId, status, joined, send]);

  if (!roomId) return null;

  return (
    <>
      <MessageList room={roomId} />
      <MessageInput room={roomId} />
    </>
  );
}
