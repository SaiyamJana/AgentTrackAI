function SignUp({ onSwitch }) {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Sign Up</h1>
      <div style={styles.row}>
        <input style={styles.input} type="text" placeholder="Full Name" />
        <input style={styles.input} type="email" placeholder="Email" />
        <input style={styles.input} type="password" placeholder="Password" />
        <button style={styles.button}>Sign Up</button>
      </div>
      <p style={styles.switchText}>
        Already have an account?{" "}
        <span style={styles.link} onClick={onSwitch}>Login</span>
      </p>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "white",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "Helvetica, Arial, sans-serif",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "black",
    marginBottom: "30px",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px",
    marginBottom: "30px",
  },
  input: {
    width: "150px",
    height: "26px",
    border: "1px solid grey",
    padding: "0 8px",
    fontSize: "11px",
    color: "grey",
    outline: "none",
    backgroundColor: "white",
  },
  button: {
    width: "60px",
    height: "28px",
    border: "1px solid grey",
    backgroundColor: "#f0f0f0",
    fontSize: "11px",
    cursor: "pointer",
  },
  switchText: {
    fontSize: "11px",
    color: "black",
  },
  link: {
    color: "blue",
    cursor: "pointer",
  },
};

export default SignUp;