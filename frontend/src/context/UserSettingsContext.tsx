"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "releasly_user_settings";

export interface UserSettings {
  youtrack_base_url: string;
  youtrack_token: string;
  azuredevops_org_url: string;
  azuredevops_pat: string;
}

const defaultSettings: UserSettings = {
  youtrack_base_url: "",
  youtrack_token: "",
  azuredevops_org_url: "",
  azuredevops_pat: "",
};

interface UserSettingsContextValue {
  settings: UserSettings;
  initialized: boolean;
  saveSettings: (s: UserSettings) => void;
  hasCredentials: () => boolean;
}

const UserSettingsContext = createContext<UserSettingsContextValue>({
  settings: defaultSettings,
  initialized: false,
  saveSettings: () => {},
  hasCredentials: () => false,
});

export function UserSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
    } catch {
      // localStorage unavailable or invalid JSON — use defaults
    }
    setInitialized(true);
  }, []);

  const saveSettings = useCallback((s: UserSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // localStorage write failure — settings live only in state
    }
    setSettings(s);
  }, []);

  const hasCredentials = useCallback(() => {
    return (
      (!!settings.youtrack_base_url && !!settings.youtrack_token) ||
      (!!settings.azuredevops_org_url && !!settings.azuredevops_pat)
    );
  }, [settings]);

  return (
    <UserSettingsContext.Provider value={{ settings, initialized, saveSettings, hasCredentials }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  return useContext(UserSettingsContext);
}
