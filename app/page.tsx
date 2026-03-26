"use client";
// @ts-nocheck
import Image from "next/image";
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

export default function Page() {
  const router = useRouter();

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
          onClick={() => go("/account")}
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
            <button
              onClick={() => go("/start-investigation")}
              className="border border-red-600 px-6 py-2 hover:bg-red-600 transition"
            >
              START INVESTIGATION
            </button>
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
            CASE PROGRESS <span className="text-red-500">1 / 5</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              title: "TASK 1 : Neural Autopsy Report",
              status: "PENDING",
              path: "/task1",
            },
            {
              title: " TASK 2 : Chain of Custody",
              status: "UNLOCK AFTER TASK 1",
              path: "/task2",
            },
            {
              title: "TASK 3 : Safety Override Auction",
              status: "UNLOCKS AFTER TASK 2",
              path: "/task3",
            },
            {
              title: "TASK 4 : Evidence Chain Builder",
              status: "UNLOCKS AFTER TASK 3",
              path: "/task4",
            },
          ].map((task, i) => (
            <button
              key={i}
              onClick={() => go(task.path)}
              className="w-full text-left p-6 rounded-xl bg-gradient-to-r from-red-900 to-black border border-red-800 hover:scale-[1.01] hover:border-red-500 transition"
            >
              <div className="text-lg tracking-wider">
                {task.title}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                STATUS: {task.status}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* GHOST ASSISTANT */}
      <button onClick={() => go("/ghost-assistant")}>
      <div className="fixed bottom-6 right-6">
        <div className="relative w-20 h-20">
          <Image
            src="/ghost_id.png"
            alt="ghost"
            fill
            className="object-contain"
          />
        </div>
      </div>
      </button>
    </div>
  );
}
