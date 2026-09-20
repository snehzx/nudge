import { useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";

type Props = { room: string };

export default function MessageList({ room }: Props) {
  const messages = useChatStore((s) => s.messages[room]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages?.length]);

  return (
    <ul className="border p-2 h-64 overflow-y-auto text-sm">
      {(messages ?? []).map((m) => (
        <li key={m.id}>
          <b>{m.from}</b>: {m.text}
        </li>
      ))}
      <div ref={bottomRef} />
    </ul>
  );
}
