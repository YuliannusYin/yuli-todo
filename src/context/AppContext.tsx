import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate } from "../i18n";
import { getSettings, updateSettings } from "../lib/ipc";
import { applyTheme } from "../lib/theme";
import {
  DEFAULT_SETTINGS,
  type AppView,
  type CommandError,
  type LocaleId,
  type Settings,
  type SettingsPatch,
} from "../lib/types";

type AppContextValue = {
  view: AppView;
  setView: (view: AppView) => void;
  settings: Settings;
  loading: boolean;
  storageError: CommandError | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  patchSettings: (patch: SettingsPatch) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function isCommandError(error: unknown): error is CommandError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "messageKey" in error,
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("board");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<CommandError | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((next) => {
        if (cancelled) {
          return;
        }
        setSettings(next);
        setStorageError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (isCommandError(error)) {
          setStorageError(error);
        } else {
          setStorageError({
            code: "STORAGE",
            messageKey: "error.storage.body",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyTheme(settings.theme_id, settings.color_scheme);
    document.documentElement.lang = settings.locale;
  }, [settings.theme_id, settings.color_scheme, settings.locale]);

  useEffect(() => {
    if (settings.color_scheme !== "system") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(settings.theme_id, "system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.color_scheme, settings.theme_id]);

  const patchSettings = useCallback(async (patch: SettingsPatch) => {
    const next = await updateSettings(patch);
    setSettings(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(settings.locale as LocaleId, key, vars),
    [settings.locale],
  );

  const value = useMemo(
    () => ({
      view,
      setView,
      settings,
      loading,
      storageError,
      t,
      patchSettings,
    }),
    [view, settings, loading, storageError, t, patchSettings],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used within AppProvider");
  }
  return value;
}
