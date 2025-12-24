import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
    });
    
    const page = await browser.newPage();
    
    // Set content with proper HTML structure
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body {
              font-family: Helvetica, Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #000000;
              background: white;
            }
            
            /* Prevent breaking inside elements */
            h1, h2, h3, p, ul, ol, div, table {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            li {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Prevent orphans and widows */
            p, li {
              orphans: 3;
              widows: 3;
            }
            
            /* Table page breaks */
            table {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            thead {
              display: table-header-group;
            }
            
            tfoot {
              display: table-footer-group;
            }
            
            .page-break {
              page-break-before: always;
              break-before: page;
            }
            
            /* Ensure links are visible in PDF */
            a {
              color: #0066cc;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    await page.setContent(fullHTML, { waitUntil: "networkidle" });
    
    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });
    
    await browser.close();
    
    // Return PDF as response (convert Buffer to Uint8Array for Response)
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

