import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/dquant banner-Photoroom.png"; // Adjust the path as necessary

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple authentication logic for demonstration
    if (email === "admin@example.com" && password === "admin") {
      navigate("/admin");
    } else if (email && password) {
      navigate("/employee");
    } else {
      alert("Please enter both email and password.");
    }
  };

  return (
    <>
      <title>Login</title>
      <meta name="description" content="Login to the task management system" />
      <div className="min-h-screen flex flex-col justify-center items-center bg-base-200">
        <div className="mb-8">
          <h1 className="text-6xl font-bold">Login</h1>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex justify-center">
          <fieldset className="fieldset border-base-200 rounded-box w-xs border p-4 bg-base-200">
            <label className="label">Email</label>
            <input
              type="email"
              className="input mb-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="label">Password</label>
            <input
              type="password"
              className="input mb-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="btn btn-neutral hover:btn-primary btn-md mt-5 w-full"
              type="submit"
            >
              Login
            </button>
            <div className="flex-row justify-between mt-4">
              <button className="btn btn-neutral hover:btn-primary btn-md mt-5 w-full" onClick={() => navigate("/admin")}>
                Link to admin
              </button>
              <button className="btn btn-neutral hover:btn-primary btn-md mt-5 w-full" onClick={() => navigate("/employee")}>
                Link to employee
                </button>
            </div>
          </fieldset>
        </form>
      </div>
    </>
  );
}

export default Login;
