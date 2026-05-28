import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../app/api";
import { useAuth } from "../../../app/providers/AuthProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, reload } = useAuth();
  const [username, setUsername] = useState("editor.user");
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await login(username, password);
    if (response.success) {
      setUser(response.data.user);
      await reload();
      navigate("/worklist");
    } else {
      setError(response.error.message);
    }

    setLoading(false);
  }

  return (
    <main style={{ padding: "4rem 1.5rem", maxWidth: 560, margin: "0 auto" }}>
      <h1>Login</h1>
      <p>Use seeded users such as `editor.user` with the local development password.</p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} style={{ display: "block", width: "100%", marginTop: "0.25rem" }} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ display: "block", width: "100%", marginTop: "0.25rem" }} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </main>
  );
}
