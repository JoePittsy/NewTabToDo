export interface GeneralSettings {
  theme?: string;
  useFirefoxContainers: boolean;
  [key: string]: any;
}

export interface BackgroundSettings {
  useSpinningBackground: boolean;
  [key: string]: any;
}

export interface Settings {
  General: GeneralSettings;
  Background: BackgroundSettings;
  [key: string]: any;
}