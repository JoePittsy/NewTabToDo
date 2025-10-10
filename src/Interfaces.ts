interface GeneralSettings {
    useFirefoxContainers: boolean;
    showFireworks?: boolean;
    [key: string]: any;
}

interface BackgroundSettings {
    useSpinningBackground: boolean;
    [key: string]: any;
}

export interface Settings {
    General: GeneralSettings;
    Background: BackgroundSettings;
    [key: string]: any;
}