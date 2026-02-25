import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ShoppingCart, Menu, X, Zap, LogOut, UserPlus } from "lucide-react";
import { useAuth, useCart } from "../store";

const NAV_LINKS = [
  { label: "Discover", path: "/", roles: ["attendee", "organizer", "admin", "finance", "marketing"] },
  { label: "My Tickets", path: "/my-tickets", roles: ["attendee", "organizer", "admin", "finance", "marketing"] },
  { label: "Organize", path: "/organizer", roles: ["organizer", "admin"] },
  { label: "Analytics", path: "/analytics", roles: ["admin", "organizer"] },
  { label: "Finance", path: "/admin", roles: ["admin", "finance"] },
  { label: "Marketing", path: "/marketing", roles: ["admin", "marketing"] },
];

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Entrance animation on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Scroll-aware shadow + background
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const visibleLinks = NAV_LINKS.filter(
    (l) => !currentUser || l.roles.includes(currentUser.role)
  );
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[64px] transition-all duration-300 ${visible ? "anim-slide-down" : "opacity-0"}`}
      style={{
        background: scrolled ? "rgba(255,248,244,0.98)" : "rgba(255,248,244,0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(249,115,22,0.12)",
        boxShadow: scrolled
          ? "0 4px 32px rgba(249,115,22,0.12)"
          : "0 1px 20px rgba(249,115,22,0.05)",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
        className="group"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
          style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", boxShadow: "0 2px 10px rgba(249,115,22,0.35)" }}
        >
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
          Plan<span style={{ color: "#f97316" }}>zo</span>
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        {visibleLinks.map((l, i) => (
          <Link
            key={l.path}
            to={l.path}
            className={`anim-fade-in delay-${i + 1}`}
            style={{
              textDecoration: "none",
              fontSize: 14,
              fontWeight: isActive(l.path) ? 700 : 500,
              color: isActive(l.path) ? "#f97316" : "#1a0a00",
              position: "relative",
              paddingBottom: 2,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => { if (!isActive(l.path)) e.currentTarget.style.color = "#f97316"; }}
            onMouseLeave={e => { if (!isActive(l.path)) e.currentTarget.style.color = "#1a0a00"; }}
          >
            {l.label}
            {/* Active underline pill */}
            <span
              style={{
                position: "absolute",
                bottom: -2,
                left: 0,
                right: 0,
                height: 2,
                borderRadius: 99,
                background: "linear-gradient(90deg,#f97316,#ef4444)",
                transform: isActive(l.path) ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
                transformOrigin: "left",
              }}
            />
          </Link>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Cart with bounce animation */}
        {cartCount > 0 && (
          <button
            onClick={() => navigate("/checkout")}
            className="relative p-2 rounded-xl transition-all duration-200 hover:bg-orange-50 hover:scale-110 active:scale-95"
          >
            <ShoppingCart size={18} style={{ color: "#f97316" }} />
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                color: "#fff",
                animation: "scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {cartCount}
            </span>
          </button>
        )}

        {currentUser ? (
          <div className="flex items-center gap-2 anim-fade-in">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform duration-200 hover:scale-110"
              style={{
                background: "linear-gradient(135deg,#f97316,#ef4444)",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
              }}
            >
              {currentUser.name[0]}
            </div>
            <span className="hidden md:block text-xs font-semibold" style={{ color: "#1a0a00" }}>
              {currentUser.name.split(" ")[0]}
            </span>
            <span
              className="hidden md:block text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}
            >
              {currentUser.role}
            </span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="ml-1 p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50 hover:scale-110 active:scale-95"
            >
              <LogOut size={14} style={{ color: "#dc2626" }} />
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 anim-fade-in">
            <Link to="/login">
              <button
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(249,115,22,0.3)",
                  color: "#f97316",
                }}
              >
                Sign In
              </button>
            </Link>
            <Link to="/register">
              <button
                className="btn-pulse px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
                style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff", boxShadow: "0 3px 12px rgba(249,115,22,0.3)" }}
              >
                Sign Up
              </button>
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg transition-all duration-200 hover:bg-orange-50 active:scale-95"
          onClick={() => setOpen(!open)}
          style={{ color: "#1a0a00" }}
        >
          <div style={{ transition: "transform 0.25s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden absolute top-16 left-0 right-0 py-4 px-6 flex flex-col gap-3 shadow-lg anim-slide-down"
          style={{ background: "#fff8f4", borderBottom: "1px solid rgba(249,115,22,0.12)" }}
        >
          {visibleLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              onClick={() => setOpen(false)}
              style={{
                textDecoration: "none",
                fontSize: 14,
                color: isActive(l.path) ? "#f97316" : "#1a0a00",
                fontWeight: isActive(l.path) ? 700 : 600,
              }}
            >
              {l.label}
            </Link>
          ))}
          {!currentUser && (
            <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(249,115,22,0.12)" }}>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", textDecoration: "none" }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
                style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff", textDecoration: "none" }}
              >
                <UserPlus size={14} /> Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
