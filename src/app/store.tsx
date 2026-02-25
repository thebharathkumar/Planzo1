import React, { createContext, useContext, useState, ReactNode } from "react";
import { User, MOCK_USERS } from "./mock-data";
import type { Role } from "./mock-data";

// ─── Auth Context ─────────────────────────────────────────────────────────

interface RegisterResult {
    success: boolean;
    error?: string;
}

interface AuthContextType {
    currentUser: User | null;
    login: (email: string, password: string, role?: string) => boolean;
    register: (name: string, email: string, password: string, role: Role) => RegisterResult;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Cart Context ─────────────────────────────────────────────────────────

interface CartItem {
    eventId: string;
    eventTitle: string;
    tierId: string;
    tierName: string;
    price: number;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (tierId: string) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ─── Providers ────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<User[]>([...MOCK_USERS]);
    const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS[0]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const login = (email: string, _password: string, role?: string) => {
        const user = users.find(
            (u) => u.email === email || (role && u.role === role)
        );
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const register = (name: string, email: string, _password: string, role: Role): RegisterResult => {
        const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) return { success: false, error: "An account with this email already exists." };

        const newUser: User = {
            id: `u${Date.now()}`,
            name,
            email,
            role,
            avatar: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
            verified: false,
        };
        setUsers((prev) => [...prev, newUser]);
        setCurrentUser(newUser);
        return { success: true };
    };

    const logout = () => setCurrentUser(null);

    const addItem = (item: CartItem) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.tierId === item.tierId);
            if (existing) {
                return prev.map((i) =>
                    i.tierId === item.tierId ? { ...i, quantity: item.quantity } : i
                );
            }
            return [...prev, item];
        });
    };

    const removeItem = (tierId: string) =>
        setCartItems((prev) => prev.filter((i) => i.tierId !== tierId));

    const clearCart = () => setCartItems([]);

    const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, isAuthenticated: !!currentUser }}>
            <CartContext.Provider value={{ items: cartItems, addItem, removeItem, clearCart, total }}>
                {children}
            </CartContext.Provider>
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AppProvider");
    return ctx;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within AppProvider");
    return ctx;
}
