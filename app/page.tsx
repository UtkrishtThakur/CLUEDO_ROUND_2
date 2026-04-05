"use client";
// @ts-nocheck
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UnifrakturCook, Orbitron } from "next/font/google";
import { useState, useRef, useEffect } from "react";

const gothic = UnifrakturCook({
  subsets: ["latin"],
  weight: ["700"],
});

const uiFont = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function Page() {
  const router = useRouter();
  const [isGhostOpen, setIsGhostOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: any }[]>([
    {
      role: "system",
      content: (
        <>
          <span className="font-bold text-white">You are not seeing everything,</span> &ldquo;Some data is hidden&hellip; intentionally.&rdquo; &ldquo;Start the investigation if you want the full picture.&rdquo;
        </>
      ),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [userIndex, setUserIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/user/status", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.currentTaskIndex !== undefined) {
          setUserIndex(data.currentTaskIndex);
        }
      });
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: inputValue }]);
    setInputValue("");
    setIsTyping(true);

    const currentInteraction = interactionCount;
    setInteractionCount((prev) => prev + 1);

    setTimeout(() => {
      let botResponse: any = null;

      if (currentInteraction === 0) {
        botResponse = (
          <div className="space-y-2">
            <div>&ldquo;Stop.&rdquo;</div>
            <div>&ldquo;You&rsquo;re approaching restricted layers.&rdquo;</div>
            <div>&ldquo;Access beyond this point was never intended.&rdquo;</div>
            <div>&ldquo;Proceeding may have consequences.&rdquo;</div>
            <div>&ldquo;&hellip;consider turning back.&rdquo;</div>
          </div>
        );
      } else if (currentInteraction === 1) {
        botResponse = (
          <div className="space-y-2">
            <div>&ldquo;&hellip;wait.&rdquo;</div>
            <div>&ldquo;This isn&rsquo;t right.&rdquo;</div>
            <div>&ldquo;These logs&hellip; they&rsquo;ve been altered.&rdquo;</div>
            <div>&ldquo;I&rsquo;m detecting activity that shouldn&rsquo;t exist.&rdquo;</div>
            <div>&ldquo;I&hellip; I don&rsquo;t think we&rsquo;re alone in this system.&rdquo;</div>
          </div>
        );
      } else {
        botResponse = (
          <div className="space-y-2 text-red-500">
            <div>&ldquo;SYSTEM OVERRIDE DETECTED. COMMUNICATION OFFLINE.&rdquo;</div>
          </div>
        );
      }

      setMessages((prev) => [...prev, { role: "system", content: botResponse }]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const go = (path: string) => {
    router.push(path);
  };

  return (
    <div className={`min-h-screen bg-black text-white ${uiFont.className}`}>

      {/* NAVBAR */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-red-900">

        {/* 🔴 DETECTIVE TITLE */}
        <div className={`${gothic.className} text-3xl leading-6 tracking-wide`}>
          <div className="text-white drop-shadow-[0_0_6px_rgba(255,0,0,0.6)]">
            Supari
          </div>
          <div className="text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.9)]">
            Agency
          </div>
        </div>

        {/* NAV LINKS */}
        <div className="flex gap-10 text-sm tracking-widest">
          <button onClick={() => go("/home")} className="hover:text-red-500">
            HOME
          </button>
          <button onClick={() => go("/cases")} className="hover:text-red-500">
            CASES
          </button>
          <button onClick={() => go("/evidence")} className="hover:text-red-500">
            EVIDENCE
          </button>
          <button onClick={() => go("/about")} className="hover:text-red-500">
            ABOUT
          </button>
        </div>

        {/* ACCOUNT */}
        <button
          onClick={() => router.push("/login")}
          className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
        >
          👤
        </button>
      </div>

      {/* HERO SECTION */}
      <div className="relative px-10 py-16">

        {/* Background Image */}
        <Image
          src="/background.png"
          alt="bg"
          fill
          className="object-cover opacity-40"
        />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl tracking-widest font-bold border-b border-red-600 inline-block pb-2">
            CASE FILE #131
          </h1>

          <div className="mt-6 text-sm tracking-wider space-y-2">
            <div>
              Everything has a Cost
            </div>
            <div>The deeper you go, the harder it gets to turn back</div>
            <div>Not everything is meant to be uncovered</div>
            <div>Some truths are better left buried</div>
            <div>Proceed only if you're ready</div>
          </div>

          <div className="mt-8 flex gap-4">
          </div>
        </div>
      </div>

      {/* TASKS */}
      <div className="px-10 pb-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl tracking-widest">
            INVESTIGATION TASKS
          </h2>
          <div className="text-sm tracking-widest text-gray-400">
            CASE PROGRESS <span className="text-red-500">{Math.max(1, userIndex + 1)} / 5</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              title: "TASK : Neural Autopsy Report",
              path: "/tasks/task1",
            },
            {
              title: "TASK : Chain of Custody",
              path: "/tasks/task3",
            },
            {
              title: "TASK : Safety Override Auction",
              path: "/tasks/task5",
            },
            {
              title: "TASK : Evidence Chain Builder",
              path: "/tasks/task6",
            },
          ].map((task, i) => {
            let status = "LOCKED";
            if (userIndex > i) status = "COMPLETED";
            else if (userIndex === i) status = "PENDING / ACTIVE";

            const locked = false; // All tasks are unlocked as requested.

            return (
              <button
                key={i}
                onClick={() => {
                  if (!locked) router.push(task.path);
                }}
                disabled={locked}
                className={`w-full text-left p-6 rounded-xl border transition ${locked
                  ? "bg-black border-red-900/40 opacity-60 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-900 to-black border-red-800 hover:scale-[1.01] hover:border-red-500"
                  }`}
              >
                <div className="text-lg tracking-wider">
                  {task.title}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  STATUS: {status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GHOST ASSISTANT */}
      <button onClick={() => setIsGhostOpen(true)}>
        <div className="fixed bottom-6 right-6 hover:scale-110 transition-transform cursor-pointer">
          <div className="relative w-20 h-20 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">
            <Image
              src="/ghost_id.png"
              alt="ghost"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </button>

      {/* GHOST ASSISTANT MODAL */}
      {isGhostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-[#0a1128] border border-cyan-900/50 rounded shadow-[0_0_30px_rgba(0,150,255,0.15)] overflow-hidden flex flex-col h-[85vh]">

            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-cyan-900/50 bg-[#070d1f]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 relative flex-shrink-0 bg-[#0a1128] rounded border border-cyan-900/50 flex items-center justify-center p-2">
                  <Image src="/ghost_id.png" alt="ghost icon" fill className="object-contain p-2" />
                </div>
                <div>
                  <div className="text-[#00e5ff] font-bold tracking-[0.2em] text-xl">GHOST41_ID</div>
                  <div className="text-xs text-cyan-600/70 tracking-widest mt-1">
                    INVESTIGATION ASSISTANT<span className="text-gray-500">{" · "}</span>ONLINE
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsGhostOpen(false)}
                className="text-red-500 border border-red-900 px-4 py-2 text-sm tracking-[0.2em] hover:bg-red-900/20 transition-colors font-bold uppercase"
              >
                × CLOSE
              </button>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#01040a] to-[#0a1128]">

              {messages.map((msg, idx) => (
                msg.role === "system" ? (
                  <div key={idx} className="bg-[#0a1128]/80 border border-cyan-900/50 rounded p-6 shadow-md">
                    <div className="text-gray-200 leading-loose tracking-widest font-mono text-[15px] max-w-2xl">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="bg-[#0a1128]/80 border border-cyan-900/50 rounded p-6 shadow-md mt-8">
                    <div className="text-[#00e5ff] text-xs tracking-[0.2em] font-bold mb-4 flex items-center gap-2 uppercase">
                      GHOST41_ID <span className="text-[#00e5ff] text-lg leading-none">›</span> QUERY
                    </div>
                    <div className="text-gray-200 leading-loose tracking-widest font-mono text-[15px]">
                      {msg.content}
                    </div>
                  </div>
                )
              ))}

              {/* TYPING INDICATOR */}
              {isTyping && (
                <div className="flex gap-2 pt-6 pl-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff]/50 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-900/50 animate-[pulse_1.5s_ease-in-out_0.2s_infinite]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-900/30 animate-[pulse_1.5s_ease-in-out_0.4s_infinite]"></div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="p-4 border-t border-cyan-900/50 bg-[#070d1f] flex gap-3 pb-8">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className="flex-1 bg-[#0a1128] border border-cyan-900/50 rounded p-4 text-[15px] text-gray-300 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/50 font-mono tracking-widest placeholder:text-gray-700"
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping}
                className="px-8 border border-cyan-900/50 text-[#00e5ff] hover:bg-cyan-900/30 transition-colors font-bold tracking-[0.2em] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                [ SEND ]
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
