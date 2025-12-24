import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsService } from "@/app/lib/google/GoogleSheetsService";

export async function GET(request: NextRequest) {
  try {
    const sheetsService = new GoogleSheetsService();
    const spreadsheets = await sheetsService.getSpreadsheetNames();

    // Format response: return array of objects with spreadsheet info
    return NextResponse.json({ 
      spreadsheets,
      // Format: "Spreadsheet Name - Sheet Name" or just "Sheet Name" if single spreadsheet
      sheets: spreadsheets.flatMap((spreadsheet) => {
        if (spreadsheet.sheetNames && spreadsheet.sheetNames.length > 0) {
          if (spreadsheets.length === 1) {
            return spreadsheet.sheetNames.map((sheetName) => ({
              value: `${spreadsheet.id}|${sheetName}`,
              label: sheetName,
            }));
          }
          return spreadsheet.sheetNames.map((sheetName) => ({
            value: `${spreadsheet.id}|${sheetName}`,
            label: `${spreadsheet.name} - ${sheetName}`,
          }));
        }
        return [];
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch sheets",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

