import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Globe, ShieldCheck, Zap } from "lucide-react";

const ROLES = [
  { key: "ADMIN" as const, label: "Admin" },
  { key: "STAFF" as const, label: "Staff" },
  { key: "SNOOKER_STAFF" as const, label: "Gaming" },
] as const;

const Login = () => {
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "ADMIN" | "STAFF" | "SNOOKER_STAFF"
  >("ADMIN");
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();

  const extractErrorMessage = (payload: unknown, fallback: string) => {
    const obj = payload as Record<string, unknown>;
    const detail = obj?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) return String(detail[0]);
    if (typeof obj?.error === "string" && obj.error.trim()) return obj.error;
    if (typeof obj?.non_field_errors === "string" && obj.non_field_errors.trim())
      return obj.non_field_errors;
    if (Array.isArray(obj?.non_field_errors) && obj.non_field_errors.length > 0)
      return String(obj.non_field_errors[0]);
    return fallback;
  };

  const navigateByRole = (role: string) => {
    if (role === "SNOOKER_STAFF") navigate("/snooker", { replace: true });
    else if (role === "STAFF") navigate("/staff", { replace: true });
    else navigate("/admin", { replace: true });
  };

  const validateRoleMatch = (role: string): string | null => {
    if (selectedRole === "ADMIN" && (role === "STAFF" || role === "SNOOKER_STAFF")) {
      return "This account is not an admin. Select the correct tab to continue.";
    }
    if (selectedRole === "STAFF" && role !== "STAFF") {
      return "This account is not a cafe staff. Select the correct tab.";
    }
    if (selectedRole === "SNOOKER_STAFF" && role !== "SNOOKER_STAFF") {
      return "This account is not snooker staff. Select the correct tab.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningIn) return;
    setError("");
    setIsSigningIn(true);

    try {
      const loginResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/accounts/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );
      const loginData = await loginResponse.json();
      if (!loginResponse.ok)
        throw new Error(extractErrorMessage(loginData, "Invalid credentials"));

      const tokenResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/accounts/token/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        const message = extractErrorMessage(tokenData, "Token generation failed");
        if (message.toLowerCase().includes("no active account"))
          throw new Error("Can't login for the day. Ask admin to activate your account.");
        throw new Error(message);
      }

      const role = loginData.role?.toUpperCase().trim();
      const roleError = validateRoleMatch(role);
      if (roleError) {
        setError(roleError);
        return;
      }

      localStorage.setItem("access", tokenData.access);
      localStorage.setItem("refresh", tokenData.refresh);
      localStorage.setItem("user", JSON.stringify(loginData));
      setUser(loginData);

      navigateByRole(role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">

        {/* ━━━ LEFT — HERO BRAND PANEL ━━━ */}
        <section className="relative hidden items-center justify-center overflow-hidden lg:flex">
          {/* Radial purple glow — centered behind the image */}
          <div
            className="absolute left-1/2 top-[38%] h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full xl:h-[560px] xl:w-[560px]"
            style={{
              background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.04) 55%, transparent 75%)",
            }}
          />

          {/* Secondary ambient glow — lower-right for depth */}
          <div
            className="absolute bottom-[10%] right-[15%] h-[260px] w-[260px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)",
            }}
          />

          {/* Content column */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 py-10 xl:px-16">

            {/* Hero image — floating with 3D drop-shadow */}
            <div className="flex flex-1 items-center justify-center">
              <img
                src="/hero.png"
                alt="Premium food bowl"
                className="w-full max-w-[380px] object-contain xl:max-w-[440px] 2xl:max-w-[480px]"
                style={{
                  filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.25))",
                }}
              />
            </div>

            {/* Headline + subtitle */}
            <div className="w-full max-w-lg pb-10 text-center xl:pb-12">
              <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 xl:text-5xl">
                Great food deserves
                <br />
                great operations.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-gray-500 xl:text-base">
                Billing, staff workflow, and daily operations unified in one
                modern platform.
              </p>
            </div>
          </div>
        </section>

        {/* ━━━ RIGHT — LOGIN FORM ━━━ */}
        <section className="flex items-center justify-center px-6 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_4px_48px_rgba(124,58,237,0.07),0_1.5px_6px_rgba(0,0,0,0.03)] sm:p-10">

            {/* Mobile hero (stacked on small screens) */}
            <div className="mb-6 flex justify-center lg:hidden">
              <img
                src="/hero.png"
                alt="Premium food bowl"
                className="h-32 object-contain"
                style={{ filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.18))" }}
              />
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-[15px] text-gray-500">
              Sign in to your account to continue
            </p>

            {/* Role switcher */}
            <div className="mt-7 rounded-full bg-gray-100 p-1">
              <div className="flex">
                {ROLES.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedRole(key)}
                    className={`
                      flex-1 rounded-full py-2.5 text-[13px] font-semibold transition-all duration-200
                      ${
                        selectedRole === key
                          ? "bg-[#7c3aed] text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-[14px] text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#7c3aed]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] leading-snug text-red-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSigningIn}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-[14px] font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningIn ? "Signing in\u2026" : "Sign In"}
              </button>
            </form>

            {/* Trust indicators */}
            <div className="mt-7 flex items-center justify-center gap-5 border-t border-gray-100 pt-5">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" /> 256-bit SSL
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-400">
                <Globe className="h-3.5 w-3.5" /> GDPR Ready
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-400">
                <Zap className="h-3.5 w-3.5" /> 99.9% Uptime
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
