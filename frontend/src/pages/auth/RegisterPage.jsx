import { useState } from "react";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div>
      <h1>Register</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
    </div>
  );
}

export default RegisterPage;