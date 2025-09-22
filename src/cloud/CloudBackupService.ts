import type { Project } from "../ProjectsProvider";
import type { Settings } from "../SettingsProvider";

/**
 * A full backup payload including projects and settings.
 */
export interface BackupPayload {
  projects: Project[];
  settings: Settings;
}

/**
 * Platform-agnostic cloud backup service interface.
 *
 * This defines the contract for cloud backup providers (Google Drive, Dropbox, OneDrive, etc).
 * Implementations should handle authentication, upload, and download of backup files.
 */
export interface CloudBackupService {
  /**
   * Returns the provider name (e.g. 'google-drive', 'dropbox').
   */
  getProviderName(): string;

  /**
   * Authenticate with the provider if necessary.
   * Could open OAuth flows or refresh existing sessions.
   */
  authenticate(): Promise<void>;

  /**
   * Upload a backup payload to the cloud under the given filename.
   */
  uploadBackup(data: BackupPayload, filename: string): Promise<void>;

  /**
   * Download a backup payload from the cloud by filename.
   * Should throw if the file does not exist.
   */
  downloadBackup(filename: string): Promise<BackupPayload>;

  /**
   * List available backup files that this provider has stored.
   */
  listBackups(): Promise<string[]>;

  /**
   * Delete a backup file by filename.
   */
  deleteBackup(filename: string): Promise<void>;
}

/**
 * Example abstract base class to extend when adding a new cloud provider.
 */
export abstract class AbstractCloudBackupService implements CloudBackupService {
  abstract getProviderName(): string;
  abstract authenticate(): Promise<void>;
  abstract uploadBackup(data: BackupPayload, filename: string): Promise<void>;
  abstract downloadBackup(filename: string): Promise<BackupPayload>;
  abstract listBackups(): Promise<string[]>;
  abstract deleteBackup(filename: string): Promise<void>;
}
