import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsService } from "@/app/lib/google/GoogleSheetsService";
import { ResumeMapper } from "@/app/lib/resume/ResumeMapper";

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, sheetName } = await request.json();

    if (!spreadsheetId || !sheetName) {
      return NextResponse.json(
        { error: "Spreadsheet ID and sheet name are required" },
        { status: 400 }
      );
    }

    // Fetch sheet data
    const sheetsService = new GoogleSheetsService();
    const range = `${sheetName}!A:Z`;
    const rows = await sheetsService.getSpreadsheetData(spreadsheetId, range);

    // Map to Resume object
    const resume = ResumeMapper.mapSheetDataToResume(rows);

    // TODO: Generate HTML resume and convert to canvas/image
    // For now, return the resume data as JSON
    return NextResponse.json({ resume });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate resume" },
      { status: 500 }
    );
  }
}

