"use client";

import * as React from "react";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Theme engine (PRD §5). Admin picks the accent identity (Purple/Cyan);
 * visitors pick Light/Dark/System. Both are constrained to safe, predefined
 * options — there is no free-form CSS anywhere in this path (§47).
 */
export type Accent = "purple" | "cyan";
export type Mode = "light" | "dark" | "system";

const MODE_KEY = "hyascka.mode";
const ACCENT_KEY = "hyascka.accent";

type ThemeContextValue = {
  mode: Mode;
  accent: Accent;
  setMode: (mode: Mode) => void;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return context;
}

/**
 * Runs before paint to apply the stored preference, so there is no flash of
 * the wrong theme. Kept as a tiny inline script on purpose.
 */
export function ThemeScript({ accent, mode }: { accent: Accent; mode: Mode }) {
  const code = `(function(){try{var d=document.documentElement;
var m=localStorage.getItem('${MODE_KEY}')||'${mode}';
var a=localStorage.getItem('${ACCENT_KEY}')||'${accent}';
var dark=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
d.classList.toggle('dark',dark);d.dataset.accent=a;d.style.colorScheme=dark?'dark':'light';}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeProvider({
  children,
  defaultAccent = "purple",
  defaultMode = "system",
}: {
  children: React.ReactNode;
  defaultAccent?: Accent;
  defaultMode?: Mode;
}) {
  const [mode, setModeState] = React.useState<Mode>(defaultMode);
  const [accent, setAccentState] = React.useState<Accent>(defaultAccent);

  React.useEffect(() => {
    const storedMode = localStorage.getItem(MODE_KEY) as Mode | null;
    const storedAccent = localStorage.getItem(ACCENT_KEY) as Accent | null;
    if (storedMode) setModeState(storedMode);
    if (storedAccent) setAccentState(storedAccent);
  }, []);

  const applyMode = React.useCallback((next: Mode) => {
    const dark =
      next === "dark" ||
      (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, []);

  React.useEffect(() => {
    applyMode(mode);
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyMode("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode, applyMode]);

  React.useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  const setMode = React.useCallback(
    (next: Mode) => {
      setModeState(next);
      localStorage.setItem(MODE_KEY, next);
    },
    [],
  );

  const setAccent = React.useCallback((next: Accent) => {
    setAccentState(next);
    localStorage.setItem(ACCENT_KEY, next);
  }, []);

  const value = React.useMemo(
    () => ({ mode, accent, setMode, setAccent }),
    [mode, accent, setMode, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const MODES: { value: Mode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Current = MODES.find((item) => item.value === mode)?.icon ?? Monitor;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Appearance settings"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Current className="h-[18px] w-[18px]" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 animate-scale-in rounded-xl border border-border bg-card p-2 shadow-elevated"
        >
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </p>
          {MODES.map((item) => (
            <button
              key={item.value}
              role="menuitemradio"
              aria-checked={mode === item.value}
              type="button"
              onClick={() => setMode(item.value)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-left">{item.label}</span>
              {mode === item.value ? <Check className="h-4 w-4 text-primary" /> : null}
            </button>
          ))}

          <div className="my-2 h-px bg-border" />
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Accent
          </p>
          <div className="flex gap-2 px-2 pb-1 pt-1">
            {(["purple", "cyan"] as Accent[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccent(value)}
                aria-pressed={accent === value}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium capitalize transition-colors",
                  accent === value ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted",
                )}
              >
                <Palette className="h-3.5 w-3.5" />
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
