import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const auth = "test";
console.log(auth);

  const handleSubmit = (e) => {
    e.preventDefault();

    login({ email, password });   // now works
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;