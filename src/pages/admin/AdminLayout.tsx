import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { handleEnterPrimaryAction } from "@/lib/enterAction";
import { createAuthFetch } from "@/lib/authFetch";
import { shouldTrackGlobalLoader } from "@/lib/requestMeta";
import { LogOut, ChevronDown, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NavItem {
  label: string;
  path: string;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", path: "/admin" },
  { label: "Sales Statistics", path: "/admin/invoices" },
  { label: "Item Entry", path: "/admin/products" },
  { label: "Ingredients Entry", path: "/admin/inventory" },
  { label: "Offers", path: "/admin/coupons" },
  { label: "Customers Data", path: "/admin/customers" },
  { label: "Suppliers", path: "/admin/vendors" },
  { label: "Purchase", path: "/admin/purchase-entry" },
  { label: "Reports", path: "/admin/reports" },
  { label: "Assets Entry", path: "/admin/assets" },
  { label: "Stock Audit", path: "/admin/stock-audit" },
  { label: "Gaming", path: "/admin/gaming" },
  { label: "Staff Management", path: "/admin/staff" },
];


const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showApiLoader, setShowApiLoader] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const activeRequestsRef = useRef(0);
  const loaderTimerRef = useRef<number | null>(null);
  const navScrollRef = useRef<HTMLElement | null>(null);

  const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest("input, textarea, select, [contenteditable='true']")
    );
  };

  const scrollNavBy = (delta: number) => {
    navScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const LOADER_DELAY_MS = 450;
    const API_ORIGIN = import.meta.env.VITE_API_BASE;

    const handleUnauthorized = () => {
      logout();
      navigate("/");
    };

    const authFetch = createAuthFetch(originalFetch, {
      apiBase: API_ORIGIN,
      onLogout: handleUnauthorized,
    });

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const trackThisRequest = shouldTrackGlobalLoader(args[0], args[1], API_ORIGIN);

      if (trackThisRequest) {
        activeRequestsRef.current += 1;

        if (activeRequestsRef.current === 1) {
          loaderTimerRef.current = window.setTimeout(() => {
            if (activeRequestsRef.current > 0) {
              setShowApiLoader(true);
            }
          }, LOADER_DELAY_MS);
        }
      }

      try {
        return await authFetch(...args);
      } finally {
        if (trackThisRequest) {
          activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);

          if (activeRequestsRef.current === 0) {
            if (loaderTimerRef.current !== null) {
              window.clearTimeout(loaderTimerRef.current);
              loaderTimerRef.current = null;
            }
            setShowApiLoader(false);
          }
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
      if (loaderTimerRef.current !== null) {
        window.clearTimeout(loaderTimerRef.current);
      }
      activeRequestsRef.current = 0;
      setShowApiLoader(false);
    };
  }, [logout, navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && !isTypingTarget(event.target)) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollNavBy(-220);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNavBy(220);
        }
      }
      handleEnterPrimaryAction(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const navEl = navScrollRef.current;
    if (!navEl) return;

    const updateScrollState = () => {
      const maxLeft = Math.max(0, navEl.scrollWidth - navEl.clientWidth);
      setCanScrollLeft(navEl.scrollLeft > 0);
      setCanScrollRight(navEl.scrollLeft < maxLeft - 1);
    };

    updateScrollState();
    navEl.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      navEl.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [location.pathname]);

  const displayName = (() => {
    const candidate =
      user?.name ??
      user?.username;

    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();

    const email = user?.email;
    if (typeof email === "string" && email.includes("@")) return email.split("@")[0];

    return "Admin User";
  })();

  const displayRole = String(
    user?.role ?? "ADMIN",
  ).replace(/_/g, " ");

 const handleLogout = async () => {
  const token = localStorage.getItem("access");

  if (token) {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE}/api/accounts/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.error("Logout API failed:", e);
    }
  }

  logout();       // clear local auth
  navigate("/");
};

  // Close profile dropdown when clicking outside
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // User initials for avatar
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* ??? PREMIUM FIXED HEADER ??? */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5 lg:px-8">

          {/* LEFT — Logo */}
          <Link to="/admin" className="flex shrink-0 items-center gap-2.5">
            <img
              src="/dip%20and%20dash.png"
              alt="Dip & Dash"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* CENTER — Navigation */}
          <div className="flex w-full max-w-[1800px] items-center gap-1 px-1">
            <button
              type="button"
              onClick={() => scrollNavBy(-220)}
              disabled={!canScrollLeft}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Scroll navigation left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <nav
              ref={navScrollRef}
              className="flex w-full flex-nowrap items-center gap-1 overflow-x-auto px-1 py-1 text-[12px] font-medium tracking-normal text-gray-600 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {adminNav.map((item) => {
                const isActive =
                  item.path === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex shrink-0 rounded-full px-2 py-1 leading-none transition-all duration-200 ${
                      isActive
                        ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                        : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => scrollNavBy(220)}
              disabled={!canScrollRight}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Scroll navigation right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* RIGHT — User profile */}
          <div className="flex shrink-0 items-center" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 ${
                profileOpen
                  ? "bg-gray-100"
                  : "hover:bg-gray-100/70"
              }`}
            >
              {/* Avatar circle */}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7c3aed] text-[11px] font-semibold text-white">
                {initials}
              </span>
              <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-gray-700 sm:block">
                {displayName}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-5 top-full mt-1.5 w-56 rounded-xl border border-gray-200/80 bg-white py-1 shadow-lg shadow-gray-200/50 lg:right-8">
                {/* User info header */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-900">
                    {displayName}
                  </p>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    {displayRole}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/admin/profile");
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    <User className="h-3.5 w-3.5" /> Profile
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ??? CONTENT ??? */}
      <main className="mx-auto w-full max-w-[1600px] px-5 pb-8 pt-[72px] lg:px-8">
        <Outlet />
      </main>

      {/* ??? API LOADER ??? */}
      {showApiLoader && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-xl shadow-gray-200/50">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#7c3aed]/20 border-t-[#7c3aed]" />
            <p className="text-[13px] font-medium text-gray-700">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;







