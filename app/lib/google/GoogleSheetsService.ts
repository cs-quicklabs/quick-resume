import { google } from "googleapis";
import type { sheets_v4, drive_v3 } from "googleapis";

export interface SheetInfo {
  id: string;
  name: string;
  sheetNames?: string[];
}

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive | null = null;
  private auth: any;

  constructor() {
    // Load credentials from environment or file
    // In production, use environment variables
    let credentials: any;
    
    // Try to load from environment variables first (recommended for production)
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      credentials = {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
      };
    } else {
      // Fallback to file (for development)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
       // credentials = require("../constants/credentials.json");
      } catch {
        throw new Error(
          "Google Sheets credentials not found. Please set environment variables or add credentials.json file."
        );
      }
    }

    // Use Drive API scope if we need to list spreadsheets
    const scopes = [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ];

    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes,
    });

    this.sheets = google.sheets({ version: "v4", auth: this.auth });
    this.drive = google.drive({ version: "v3", auth: this.auth });
  }

  /**
   * Get all spreadsheets accessible by the service account
   * Returns array of spreadsheet info with id, name, and sheet names
   */
  async getSpreadsheetNames(): Promise<SheetInfo[]> {
    try {
      // Option 1: If GOOGLE_SPREADSHEET_ID is set, return that specific spreadsheet
      const specificSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (specificSpreadsheetId) {
        const sheetNames = await this.getAllSheetNames(specificSpreadsheetId);
        const spreadsheetInfo = await this.getSpreadsheetInfo(specificSpreadsheetId);
        return [
          {
            id: specificSpreadsheetId,
            name: spreadsheetInfo.name,
            sheetNames,
          },
        ];
      }

      // Option 2: Fetch all spreadsheets using Drive API
      if (!this.drive) {
        throw new Error("Drive API not initialized");
      }

      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: "files(id, name)",
        pageSize: 100,
      });

      if (!response.data.files || response.data.files.length === 0) {
        return [];
      }

      // Fetch sheet names for each spreadsheet
      const spreadsheetInfos: SheetInfo[] = await Promise.all(
        response.data.files.map(async (file) => {
          const sheetNames = await this.getAllSheetNames(file.id!);
          return {
            id: file.id!,
            name: file.name || "Untitled",
            sheetNames,
          };
        })
      );

      return spreadsheetInfos;
    } catch (error) {
      throw new Error(
        `Failed to fetch spreadsheet names: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get spreadsheet metadata (name, etc.)
   */
  async getSpreadsheetInfo(spreadsheetId: string): Promise<{ name: string }> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      return {
        name: response.data.properties?.title || "Untitled",
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch spreadsheet info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getSpreadsheetData(spreadsheetId: string, range: string): Promise<string[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return (response.data.values || []) as string[][];
    } catch (error) {
      throw new Error(`Failed to fetch sheet data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all sheet names within a specific spreadsheet
   */
  async getAllSheetNames(spreadsheetId: string): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      return (
        response.data.sheets?.map((sheet) => sheet.properties?.title || "Untitled") || []
      );
    } catch (error) {
      throw new Error(
        `Failed to fetch sheet names: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

