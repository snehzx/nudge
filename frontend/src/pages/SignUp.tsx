import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function SignUp() {
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await signup(form.username, form.email, form.password);
      navigate("/", { replace: true });
    } catch (e: any) {
      const errs = e.response?.data?.errors;
      setError(
        errs?.length
          ? errs.map((x: any) => `${x.field}: ${x.message}`).join(", ")
          : (e.response?.data?.message ?? "sign up failed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-2 max-w-xs">
      <p>sign up</p>
      <input
        className="border p-1"
        placeholder="username"
        value={form.username}
        onChange={(e) => update("username", e.target.value)}
      />
      <input
        className="border p-1"
        placeholder="email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
      />
      <input
        className="border p-1"
        type="password"
        placeholder="password"
        value={form.password}
        onChange={(e) => update("password", e.target.value)}
      />
      <button className="border p-1" onClick={submit} disabled={busy}>
        {busy ? "…" : "create"}
      </button>
      <Link to="/signin" className="text-sm underline">
        have an account?
      </Link>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
