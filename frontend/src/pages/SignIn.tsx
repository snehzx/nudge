import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function SignIn() {
  const signin = useAuthStore((s) => s.signin);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as any)?.from?.pathname ?? "/";

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await signin(email, password);
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e.response?.data?.message ?? "sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-2 max-w-xs">
      <p>sign in</p>
      <input
        className="border p-1"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-1"
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="border p-1" onClick={submit} disabled={busy}>
        {busy ? "…" : "go"}
      </button>
      <Link to="/signup" className="text-sm underline">
        need an account?
      </Link>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
