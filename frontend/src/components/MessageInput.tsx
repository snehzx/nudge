import { useState } from "react";
import { useChatStore } from "../store/chatStore";

type Props = { room: string };

export default function MessageInput({ room }: Props) {
  const send = useChatStore((s) => s.send);
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    send({ type: "chat", room, text: trimmed });
    setText("");
  }

  return (
    <input
      className="border p-1"
      placeholder="message + enter"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
      }}
    />
  );
}
