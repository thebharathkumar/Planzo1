import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, ShoppingCart, Menu, X, Zap, LogOut, User } from "lucide-react";
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
  const navigate = useNavigate();

  const visibleLinks = NAV_LINKS.filter(
    (l) => !currentUser || l.roles.includes(currentUser.role)
  );
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const activeStyle = (path: string) => {
    const active = window.location.pathname === path;
    return {
      color: active ? "#f97316" : "#1a0a00",
      fontWeight: active ? "700" : "500",
      borderBottom: active ? "2px solid #f97316" : "2px solid transparent",
      paddingBottom: 2,
    };
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[64px]"
      style={{
        background: "rgba(255,248,244,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(249,115,22,0.12)",
        boxShadow: "0 1px 20px rgba(249,115,22,0.06)",
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
          Plan<span style={{ color: "#f97316" }}>zo</span>
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        {visibleLinks.map((l) => (
          <Link key={l.path} to={l.path} style={{ textDecoration: "none", fontSize: 14, ...activeStyle(l.path) }}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Cart */}
        <button
          onClick={() => navigate("/checkout")}
          className="relative p-2 rounded-xl transition-all hover:bg-orange-50"
          style={{ display: cartCount === 0 ? "none" : "flex" }}
        >
          <ShoppingCart size={18} style={{ color: "#f97316" }} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "#ef4444", color: "#fff" }}>
            {cartCount}
          </span>
        </button>

        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>
              {currentUser.name[0]}
            </div>
            <span className="hidden md:block text-xs font-semibold" style={{ color: "#1a0a00" }}>{currentUser.name.split(" ")[0]}</span>
            <span className="hidden md:block text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>{currentUser.role}</span>
            <button onClick={() => { logout(); navigate("/login"); }} className="ml-1 p-1.5 rounded-lg transition-all hover:bg-red-50">
              <LogOut size={14} style={{ color: "#dc2626" }} />
            </button>
          </div>
        ) : (
          <Link to="/login">
            <button className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>
              Sign In
            </button>
          </Link>
        )}

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} style={{ color: "#1a0a00" }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 py-4 px-6 flex flex-col gap-3 shadow-lg" style={{ background: "#fff8f4", borderBottom: "1px solid rgba(249,115,22,0.12)" }}>
          {visibleLinks.map((l) => (
            <Link key={l.path} to={l.path} onClick={() => setOpen(false)} style={{ textDecoration: "none", fontSize: 14, color: "#1a0a00", fontWeight: 600 }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
