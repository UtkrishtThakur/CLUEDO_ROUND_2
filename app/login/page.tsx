"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UnifrakturCook, Orbitron } from "next/font/google";

const gothic = UnifrakturCook({
  subsets: ["latin"],
  weight: ["700"],
});

const uiFont = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Assuming successful login, redirect to the main page
    router.push("/");
  };

  return (
    <div className={`min-h-screen bg-black text-white ${uiFont.className} flex flex-col items-center justify-center p-6`}>
      
      {/* 🔴 DETECTIVE TITLE */}
      <div className={`${gothic.className} text-5xl md:text-6xl leading-tight tracking-wide text-center mb-12`}>
        <div className="text-white drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]">
          Detective
        </div>
        <div className="text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.9)]">
          agency
        </div>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-gradient-to-b from-red-950 to-black border border-red-800 p-8 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.2)]">
        <h2 className="text-2xl tracking-widest text-center mb-6 uppercase border-b border-red-900 pb-4">
          Agent Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm tracking-widest text-gray-400 mb-2">
              AGENT ID / EMAIL
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-white"
              placeholder="Enter your credentials"
            />
          </div>

          <div>
            <label className="block text-sm tracking-widest text-gray-400 mb-2">
              SECURITY CLEARANCE KEY
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-8 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded border border-red-500 transition tracking-widest hover:shadow-[0_0_15px_rgba(255,0,0,0.6)]"
          >
            AUTHORIZE ACCESS
          </button>
        </form>

        <div className="mt-6 text-center text-xs tracking-widest text-gray-500">
          <p>UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED.</p>
          <p className="mt-1">SECURE CONNECTION ESTABLISHED.</p>
        </div>
      </div>
    </div>
  );
}
