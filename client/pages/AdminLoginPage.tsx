import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Shield,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { Link } from "react-router-dom";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, loading: authLoading, error: authError } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Redirect based on role — the dashboard will handle role-based views
        navigate("/admin/dashboard");
      } else {
        setLocalError("Invalid credentials or insufficient permissions.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Login failed");
    } finally {
      setLocalLoading(false);
    }
  };

  const displayError = localError || authError;
  const isLoading = localLoading || authLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-slate-900/95 text-white border-slate-700/50 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-indigo-500/50 transition-shadow duration-300">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <CardTitle className="text-2xl font-bold">
              Admin / Supervisor Login
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Green India Management Portal
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {displayError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Alert className="bg-red-500/15 border-red-500/40 text-red-300 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Label className="text-gray-300 font-medium mb-2 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <Input
                    type="email"
                    className="pl-11 pr-4 py-2.5 bg-slate-800/50 border-slate-700/50 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-600/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@greenindia.com"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Label className="text-gray-300 font-medium mb-2 block">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pl-11 pr-12 py-2.5 bg-slate-800/50 border-slate-700/50 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-600/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 text-gray-500 hover:text-indigo-400 hover:bg-slate-700/30 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 transform hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Sign In as Staff
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Info banner */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 text-sm text-indigo-300">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Staff-only portal</p>
                  <p className="text-indigo-400 text-xs mt-1">
                    Super Admins, Admins, and Supervisors can sign in here. Citizens please use the{" "}
                    <Link to="/login" className="underline hover:text-white">
                      regular login
                    </Link>.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
