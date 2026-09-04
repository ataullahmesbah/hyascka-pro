"use client";

import * as React from "react";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  THEME_META,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
  type ThemePolicy,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  policy: ThemePolicy;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return context;
}

/**
 * Applies the theme before first paint so there is never a flash of the wrong
 * palette. Deliberately tiny and inline — it must run before the stylesheet
 * paints, which rules out a separate request.
 */
export function ThemeScript({ policy }: { policy: ThemePolicy }) {
  const code = `(function(){try{
var d=document.documentElement;
var allowed=${JSON.stringify(policy.enabledThemes)};
var def=${JSON.stringify(policy.defaultTheme)};
var canToggle=${policy.allowUserToggle ? "true" : "false"};
var t=def;
if(canToggle){
  var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if(s&&allowed.indexOf(s)>-1){t=s;}
  else{
    var dark=allowed.filter(function(x){return x!=='light';})[0];
    if(window.matchMedia('(prefers-color-scheme: dark)').matches&&dark&&allowed.indexOf('light')>-1){t=dark;}
  }
}
d.setAttribute('data-theme',t);
d.style.colorScheme=(t==='light')?'light':'dark';
}catch(e){}
try{
  // Signed-in state, before paint, so the navbar never flashes the wrong
  // button. The cookie is a boolean hint only — see AUTH_HINT_COOKIE.
  d.setAttribute('data-auth',/(?:^|; )hyascka_auth=1/.test(document.cookie)?'in':'out');
}catch(e){}
})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeProvider({
  policy,
  children,
}: {
  policy: ThemePolicy;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = React.useState<ThemeId>(policy.defaultTheme);

  // Adopt whatever the pre-paint script already decided, so React state and the
  // DOM never disagree after hydration.
  React.useEffect(() => {
    const applied = document.documentElement.getAttribute("data-theme");
    if (isThemeId(applied)) setThemeState(applied);
  }, []);

  const setTheme = React.useCallback(
    (next: ThemeId) => {
      if (!policy.allowUserToggle || !policy.enabledThemes.includes(next)) return;
      setThemeState(next);
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.style.colorScheme = next === "light" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* private mode — the choice simply does not persist */
      }
    },
    [policy],
  );

  const value = React.useMemo(() => ({ theme, setTheme, policy }), [theme, setTheme, policy]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const ICONS: Record<ThemeId, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  midnight: Moon,
  network: Monitor,
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, policy } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Locked to one theme by the dashboard — there is nothing to choose.
  if (!policy.allowUserToggle) return null;

  const Current = ICONS[theme];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${THEME_META[theme].label}. Change appearance`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-line-strong text-ink-soft transition-colors duration-fast hover:border-accent-border hover:bg-surface-2 hover:text-ink"
      >
        <Current className="h-[1.05rem] w-[1.05rem]" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 animate-scale-in overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-lg"
        >
          <p className="px-2.5 py-1.5 text-step--2 font-semibold uppercase tracking-wide text-ink-muted">
            Appearance
          </p>
          {policy.enabledThemes.map((id) => {
            const Icon = ICONS[id];
            const meta = THEME_META[id];
            return (
              <button
                key={id}
                role="menuitemradio"
                aria-checked={theme === id}
                type="button"
                onClick={() => {
                  setTheme(id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-colors duration-fast hover:bg-surface-2",
                  theme === id && "bg-surface-2",
                )}
              >
                <span
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-line-strong"
                  style={{ background: meta.swatch }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-step--1 font-medium text-ink">
                    <Icon className="h-3.5 w-3.5 text-ink-muted" />
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-step--2 leading-snug text-ink-muted">
                    {meta.description}
                  </span>
                </span>
                {theme === id ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> : null}
              </button>
            );
          })}
          <p className="mt-1 flex items-center gap-1.5 border-t border-line px-2.5 pb-1 pt-2 text-step--2 text-ink-muted">
            <Palette className="h-3 w-3" />
            Saved to this device only.
          </p>
        </div>
      ) : null}
    </div>
  );
}
