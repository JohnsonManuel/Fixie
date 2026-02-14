import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const SignupAdmin = () => {
  const { signUpAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirm") setConfirm(value);

    if (error) setError("");
    if (errorFields.includes(field)) {
      setErrorFields(errorFields.filter((f) => f !== field));
    }
    if (field === "password" || field === "confirm") {
      if (errorFields.includes("confirm")) {
        setErrorFields(errorFields.filter((f) => f !== "confirm"));
      }
    }
  };

  const validateForm = () => {
    const newErrorFields: string[] = [];
    if (password !== confirm) {
      setError("Passwords do not match");
      newErrorFields.push("confirm");
      setErrorFields(newErrorFields);
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      newErrorFields.push("password");
      setErrorFields(newErrorFields);
      return false;
    }
    setErrorFields([]);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setErrorFields([]);
      const user = await signUpAdmin(email, password);
      setMessage(
        `A verification email has been sent to ${user.email}. Please verify before continuing.`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-admin p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tech Admin Sign-Up</h1>
      {error && (
        <div className="error mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="success mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`p-2 border rounded ${errorFields.includes("email") ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={`p-2 border rounded ${errorFields.includes("password") ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => handleInputChange("confirm", e.target.value)}
            className={`p-2 border rounded ${errorFields.includes("confirm") ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Admin Account"}
        </button>
      </form>
    </div>
  );
};

export default SignupAdmin;
