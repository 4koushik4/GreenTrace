/**
 * Developer Login Page
 * Hardcoded credentials — Username: INDIA, Password: BHARAT
 * Bypasses Supabase auth entirely.
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Terminal, Eye, EyeOff, AlertCircle } from "lucide-react";

const DEV_USERNAME = "INDIA";
const DEV_PASSWORD = "BHARAT";

export default function DevLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate brief delay for UX
    await new Promise((r) => setTimeout(r, 400));

    if (username === DEV_USERNAME && password === DEV_PASSWORD) {
      const session = {
        role: "developer",
        username: DEV_USERNAME,
        loginTime: new Date().toISOString(),
        token: btoa(`${DEV_USERNAME}:${Date.now()}`),
      };
      localStorage.setItem("dev_session", JSON.stringify(session));
      navigate("/dev/dashboard");
    } else {
      setError("Invalid credentials. Access denied.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      {/* Animated grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <Terminal className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Developer Access</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Restricted access — Authorized personnel only
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 shadow-2xl shadow-green-500/5">
          <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-xs font-mono">
              SECURE DEVELOPER PORTAL
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-mono tracking-wider transition-colors"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.toUpperCase())}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-mono tracking-wider transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Access System
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-between text-sm">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              ← Home
            </Link>
            <Link to="/admin/login" className="text-gray-400 hover:text-green-400 transition-colors">
              Staff Portal →
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Green India — Smart Waste Management System
        </p>
      </motion.div>
    </div>
  );
}
