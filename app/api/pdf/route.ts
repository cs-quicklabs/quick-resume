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
            
            /* Section containers - allow breaking if too large, but prefer keeping together */
            [data-section] {
              page-break-inside: auto;
              break-inside: auto;
            }
            
            /* Section headings - keep with at least the first line of content */
            [data-section] > div:first-child {
              page-break-after: avoid;
              break-after: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Prevent breaking inside specific elements */
            h1, h2, h3 {
              page-break-after: avoid;
              break-after: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Paragraphs - prevent orphans/widows */
            p {
              orphans: 3;
              widows: 3;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* List items - keep individual items together, but allow breaking between items */
            ul, ol {
              page-break-inside: auto;
              break-inside: auto;
            }
            
            li {
              orphans: 2;
              widows: 2;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Tables - allow breaking across pages if needed */
            table {
              page-break-inside: auto;
              break-inside: auto;
            }
            
            /* Table rows should not break */
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Table headers repeat on new pages */
            thead {
              display: table-header-group;
            }
            
            tfoot {
              display: table-footer-group;
            }
            
            /* Individual project items - keep each project together */
            [data-section="projects"] > div[style*="marginBottom"] {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Individual work experience items - keep together */
            [data-section="experience"] ul > li {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Summary list items - keep together */
            [data-section="summary"] ul > li {
              page-break-inside: avoid;
              break-inside: avoid;
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

