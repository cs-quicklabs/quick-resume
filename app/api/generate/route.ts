import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsService } from "@/app/lib/google/GoogleSheetsService";
import { ResumeMapper } from "@/app/lib/resume/ResumeMapper";

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId: bodySpreadsheetId, sheetName, sheetGid } = await request.json();

    const spreadsheetId = bodySpreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId || (!sheetName && sheetGid === undefined)) {
      return NextResponse.json(
        {
          error:
            "Spreadsheet ID (or GOOGLE_SPREADSHEET_ID) and either sheet name or sheet GID are required",
        },
        { status: 400 }
      );
    }

    // Fetch sheet data
    const sheetsService = new GoogleSheetsService();
    let resolvedSheetName: string | undefined = sheetName;
    const resolvedSheetGid: number | undefined =
      sheetGid !== undefined
        ? typeof sheetGid === "number"
          ? sheetGid
          : Number.parseInt(String(sheetGid), 10)
        : undefined;

    if (resolvedSheetGid !== undefined && Number.isNaN(resolvedSheetGid)) {
      return NextResponse.json({ error: "Invalid sheet GID" }, { status: 400 });
    }

    if (!resolvedSheetName && sheetGid !== undefined) {
      resolvedSheetName = await sheetsService.getSheetNameByGid(
        spreadsheetId,
        resolvedSheetGid as number
      );
    }

    const range = `${resolvedSheetName}!A:AG`;
    const rows = await sheetsService.getSpreadsheetData(spreadsheetId, range);

    // Map to Resume object
    const resume = ResumeMapper.mapSheetDataToResume(rows);

    // TODO: Generate HTML resume and convert to canvas/image
    // For now, return the resume data as JSON
    return NextResponse.json({
      resume,
      spreadsheetId,
      sheetName: resolvedSheetName,
      sheetGid: resolvedSheetGid,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate resume" },
      { status: 500 }
    );
  }
}

