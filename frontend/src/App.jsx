import { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp";

export default function App() {
  const [page, setPage] = useState("login");

  return page === "login" ? (
    <Login onSwitch={() => setPage("signup")} />
  ) : (
    <SignUp onSwitch={() => setPage("login")} />
  );
}