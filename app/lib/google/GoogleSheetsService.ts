import "server-only";
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import type { GoogleAuth } from "google-auth-library";

export interface SheetInfo {
  id: string;
  name: string;
  sheetNames?: string[];
  sheets?: Array<{ name: string; gid: number }>;
}

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private auth: GoogleAuth;

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = {
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
      GOOGLE_PRIVATE_KEY_ID: process.env.GOOGLE_PRIVATE_KEY_ID,
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Google Sheets environment variables: ${missingVars.join(", ")}. Please set these in your environment configuration.`
      );
    }

    // Create credentials object with validated environment variables
    const credentials = {
      type: "service_account",
      project_id: requiredEnvVars.GOOGLE_PROJECT_ID,
      private_key_id: requiredEnvVars.GOOGLE_PRIVATE_KEY_ID,
      private_key: requiredEnvVars.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      client_email: requiredEnvVars.GOOGLE_CLIENT_EMAIL,
      client_id: requiredEnvVars.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
    };

    const scopes = [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ];

    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes,
    });

    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  /**
   * Get spreadsheet metadata including all sheets with their names and GIDs
   */
  async getSpreadsheetInfo(spreadsheetId: string): Promise<SheetInfo> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheetNames: string[] = [];
      const sheets: Array<{ name: string; gid: number }> = [];

      response.data.sheets?.forEach((sheet) => {
        const name = sheet.properties?.title || "Untitled";
        const gid = sheet.properties?.sheetId;
        
        if (name && typeof gid === "number") {
          sheetNames.push(name);
          sheets.push({ name, gid });
        }
      });

      return {
        id: spreadsheetId,
        name: response.data.properties?.title || "Untitled",
        sheetNames,
        sheets,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch spreadsheet info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Resolve a sheet name (tab title) from a sheet GID.
   */
  async getSheetNameByGid(spreadsheetId: string, sheetGid: number): Promise<string> {
    try {
      const response = await this.sheets.spreadsheets.get({ spreadsheetId });

      const match = response.data.sheets?.find(
        (sheet) => sheet.properties?.sheetId === sheetGid
      );

      const title = match?.properties?.title;
      if (!title) {
        throw new Error(`Sheet with GID ${sheetGid} not found in spreadsheet ${spreadsheetId}`);
      }

      return title;
    } catch (error) {
      throw new Error(
        `Failed to resolve sheet name for GID ${sheetGid}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all spreadsheets accessible by the service account
   * Returns array of spreadsheet info with id, name, and sheet names with GIDs
   */
  async getSpreadsheetNames(): Promise<SheetInfo[]> {
    try {
      const specificSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (specificSpreadsheetId) {
        const spreadsheetInfo = await this.getSpreadsheetInfo(specificSpreadsheetId);
        return [spreadsheetInfo];
      }

      return [];
    } catch (error) {
      throw new Error(
        `Failed to fetch spreadsheet names: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get spreadsheet data (cell values) for a specific range
   */
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
}

