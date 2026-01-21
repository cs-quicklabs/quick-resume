"use client";

import React, { useEffect, useState, useRef } from "react";
import { Resume, Blog } from "@/app/lib/types/resume";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function PreviewPage() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const resumeContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const candidateGid = searchParams.get("candidateGid");

  useEffect(() => {
    const load = async () => {
      if (!candidateGid) {
        setError("No resume data found. Please generate a resume first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // API expects sheetGid; frontend uses candidateGid in the URL.
            sheetGid: Number.parseInt(candidateGid, 10),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch resume from Google Sheets");
        }

        const data = await response.json();
        setResume(data.resume as Resume);
        setSpreadsheetId(data.spreadsheetId ? String(data.spreadsheetId) : null);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch resume data");
        setLoading(false);
      }
    };

    setLoading(true);
    setError("");
    void load();
  }, [candidateGid]);

  const handlePrint = async () => {
    if (!resumeContainerRef.current) return;

    setGeneratingPdf(true);
    try {
      const element = resumeContainerRef.current;
      const htmlContent = element.innerHTML;

      // Send HTML to Playwright API for PDF generation
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get PDF blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume?.personalInfo.name} - ${resume?.personalInfo?.designation}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleOpenInGoogleSheets = () => {
    if (!spreadsheetId || !candidateGid) {
      alert("Spreadsheet information not found. Please generate a resume first.");
      return;
    }

    // Construct Google Sheets URL with specific sheet selected
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${candidateGid}#gid=${candidateGid}`;

    // Open in new tab
    window.open(url, "_blank");
  };

  const handleCopyShareLink = async () => {
    if (!candidateGid) {
      alert("Candidate id not found. Please generate a resume first.");
      return;
    }

    const shareUrl = `${window.location.origin}/preview?candidateGid=${encodeURIComponent(candidateGid)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard");
    } catch {
      // Fallback for browsers without clipboard permissions
      prompt("Copy this share link:", shareUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">{error || "Resume not found"}</p>
        </div>
      </div>
    );
  }

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return "";
    if (end === "Present") return `${start} - Present`;
    if (start && end) return `${start} - ${end}`;
    return start || end || "";
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          .resume-container {
            margin: 0;
            padding: 20mm;
            width: 100%;
            box-shadow: none;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
        
        @media screen {
          .resume-pages-wrapper {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
            padding: 20px 0;
          }
          
          .resume-page {
            width: 210mm;
            height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            page-break-after: always;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          .resume-container {
            max-width: 210mm;
            margin: 20px auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="no-print">
          <Header
            onPrint={handlePrint}
            generatingPdf={generatingPdf}
            onOpenSheet={handleOpenInGoogleSheets}
            actions={
              <Button
                onClick={handleCopyShareLink}
                disabled={generatingPdf}
                variant="outline"
                className="bg-transparent hover:bg-gray-700 text-white border-white/20 hover:border-white/40"
              >
                Copy share link
              </Button>
            }
            userInitials={
              resume?.personalInfo?.name
                ? resume.personalInfo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                : undefined
            }
          />
        </div>

        <div className="container mx-auto px-4 py-4">

          {/* Resume HTML Container */}
          <div
            ref={resumeContainerRef}
            className="resume-container"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "20mm",
              margin: "0 auto",
              backgroundColor: "#ffffff",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "11pt",
              lineHeight: "1.5",
              color: "#000000",
            }}
          >
            {/* Header */}
            <div data-section="header" style={{ marginBottom: "8mm", position: "relative" }}>
              {/* <Image> tag of Next js would not work here as we are using Playright to generate pdf, Playright runs on server so we can resolve image using url we need convert into Base-64 beacasue we uisng html string to send it to playright using api. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/crownstack_logo.png"
                alt="CrownStack Logo"
                className="resume-logo"
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  maxHeight: "40mm",
                  maxWidth: "70mm",
                  height: "auto",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
              <h1 style={{ fontSize: "18pt", fontWeight: "bold", color: "#000000", paddingRight: "55mm" }}>
                {resume.personalInfo.name}
              </h1>
              {resume.personalInfo.designation && (
                <div style={{ fontSize: "11pt", color: "#333333", paddingRight: "55mm" }}>
                  <strong>{resume.personalInfo.designation}</strong>
                </div>
              )}
              {resume.personalInfo.company && (
                <div style={{ fontSize: "11pt", color: "#555555", paddingRight: "55mm" }}>
                  <strong>{resume.personalInfo.company}</strong>
                </div>
              )}
            </div>

            {/* Objective */}
            {resume.objective && (
              <div data-section="objective" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  OBJECTIVE
                </div>
                <p style={{ fontSize: "11pt", lineHeight: "1.6", textAlign: "justify", margin: "0", color: "#000000" }}>
                  {resume.objective}
                </p>
              </div>
            )}

            {/* Summary */}
            {resume.summary.length > 0 && (
              <div data-section="summary" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  SUMMARY
                </div>
                <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                  {resume.summary.map((item, index) => (
                    <li key={index} style={{ fontSize: "11pt", lineHeight: "1.6", marginBottom: "2mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
                      <span style={{ position: "absolute", left: "0" }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Skills */}
            {Object.keys(resume.technicalSkills).length > 0 && (
              <div data-section="skills" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  TECHNICAL SKILLS
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", margin: "0", border: "1px solid #000000" }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: "11pt", fontWeight: "bold", textAlign: "left", padding: "2mm", borderBottom: "1px solid #000000", borderRight: "1px solid #000000", borderTop: "1px solid #000000", borderLeft: "1px solid #000000", color: "#000000", width: "30%" }}>
                        Skill Category
                      </th>
                      <th style={{ fontSize: "11pt", fontWeight: "bold", textAlign: "left", padding: "2mm", borderBottom: "1px solid #000000", borderTop: "1px solid #000000", borderRight: "1px solid #000000", color: "#000000", width: "70%" }}>
                        Skills/Tools
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(resume.technicalSkills).map(([category, skills], index) => {
                      return (
                        <tr key={index}>
                          <td style={{ fontSize: "11pt", padding: "2mm", borderBottom: "1px solid #000000", borderRight: "1px solid #000000", borderLeft: "1px solid #000000", color: "#000000", width: "30%" }}>
                            {category}
                          </td>
                          <td style={{ fontSize: "11pt", padding: "2mm", borderBottom: "1px solid #000000", borderRight: "1px solid #000000", color: "#000000", width: "70%" }}>
                            {skills.join(", ")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Projects */}
            {resume.projects.length > 0 && (
              <div data-section="projects" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  PROJECTS
                </div>
                {resume.projects.map((project, index) => (
                  <div key={index} style={{ marginBottom: "6mm" }}>
                    <div style={{ marginBottom: "2mm" }}>
                      {project.name && (
                        <div style={{ fontSize: "11pt", color: "#000000" }}>
                          <strong style={{ color: "#000000" }}>Project Name:</strong> {project.name}
                        </div>
                      )}
                      {project.role && (
                        <div style={{ fontSize: "11pt", color: "#000000" }}>
                          <strong style={{ color: "#000000" }}>Role:</strong> {project.role}
                        </div>
                      )}
                      {project.techStack && project.techStack.length > 0 && (
                        <div style={{ fontSize: "11pt", color: "#000000" }}>
                          <strong style={{ color: "#000000" }}>Tech Stack:</strong> {project.techStack.join(", ")}
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <div style={{ fontSize: "11pt", lineHeight: "1.6", color: "#000000" }}>
                        <strong style={{ color: "#000000" }}>Description:</strong> {project.description}
                      </div>
                    )}
                    {project.responsibilities.length > 0 && (
                      <div>
                        <strong style={{ color: "#000000" }}>Role & Responsibility:</strong>
                        <ul style={{ listStyle: "none", padding: "0" }}>
                          {project.responsibilities.map((resp, respIndex) => (
                            <li key={respIndex} style={{ fontSize: "11pt", lineHeight: "1.5", marginBottom: "1mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
                              <span style={{ position: "absolute", left: "0" }}>•</span>
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {resume.certifications && resume.certifications.length > 0 && (
              <div data-section="certifications" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  CERTIFICATION
                </div>
                <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                  {resume.certifications.map((cert, index) => (
                    <li key={index} style={{ fontSize: "11pt", lineHeight: "1.6", marginBottom: "2mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
                      <span style={{ position: "absolute", left: "0" }}>•</span>
                      {cert.name}
                      {cert.id && ` [${cert.id}]`}
                      {cert.url && (
                        <span>
                          {" "}
                          <a href={cert.url} style={{ color: "#0066cc", textDecoration: "underline" }}>
                            (Click to open the credentials)
                          </a>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Blogs And Articles */}
            {resume.blogs && resume.blogs.length > 0 && (
              <div data-section="blogs" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  BLOGS AND ARTICLES PUBLISHED
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", margin: "0", border: "1px solid #000000" }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: "11pt", fontWeight: "bold", textAlign: "left", padding: "2mm", borderBottom: "1px solid #000000", borderRight: "1px solid #000000", borderTop: "1px solid #000000", borderLeft: "1px solid #000000", color: "#000000", width: "30%" }}>
                        Category
                      </th>
                      <th style={{ fontSize: "11pt", fontWeight: "bold", textAlign: "left", padding: "2mm", borderBottom: "1px solid #000000", borderTop: "1px solid #000000", borderRight: "1px solid #000000", color: "#000000", width: "70%" }}>
                        Blogs and articles
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Group blogs by category
                      const groupedBlogs: { [category: string]: Blog[] } = {};
                      resume.blogs.forEach(blog => {
                        const category = blog.category || "Others";
                        if (!groupedBlogs[category]) {
                          groupedBlogs[category] = [];
                        }
                        groupedBlogs[category].push(blog);
                      });

                      // Sort categories - "Others" should be last
                      const sortedCategories = Object.keys(groupedBlogs).sort((a, b) => {
                        if (a === "Others") return 1;
                        if (b === "Others") return -1;
                        return a.localeCompare(b);
                      });

                      const allRows: Array<{ category: string; blog: Blog; blogIndex: number; categoryIndex: number }> = [];
                      sortedCategories.forEach((category) => {
                        const blogs = groupedBlogs[category];
                        blogs.forEach((blog, blogIndex) => {
                          allRows.push({ category, blog, blogIndex, categoryIndex: 0 });
                        });
                      });

                      const rows: React.ReactElement[] = [];
                      allRows.forEach((rowData) => {
                        const isFirstInCategory = rowData.blogIndex === 0;
                        const categoryBlogs = groupedBlogs[rowData.category];
                        rows.push(
                          <tr key={`${rowData.category}-${rowData.blogIndex}`}>
                            {isFirstInCategory ? (
                              <td rowSpan={categoryBlogs.length} style={{ fontSize: "11pt", padding: "2mm", borderBottom: "1px solid #000000", borderRight: "1px solid #000000", borderLeft: "1px solid #000000", color: "#000000", verticalAlign: "top", width: "30%" }}>
                                {rowData.category}
                              </td>
                            ) : null}
                            <td style={{ fontSize: "11pt", padding: "2mm", borderBottom: "1px solid #000000", borderRight: "1px solid #000000", color: "#000000", width: "70%" }}>
                              {rowData.blogIndex + 1}. {rowData.blog.url ? (
                                <a href={rowData.blog.url} style={{ color: "#0066cc", textDecoration: "underline" }}>
                                  {rowData.blog.title}
                                </a>
                              ) : (
                                rowData.blog.title
                              )}
                            </td>
                          </tr>
                        );
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Awards & Achievements */}
            {resume.awards && resume.awards.length > 0 && (
              <div data-section="awards" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  AWARDS & ACHIEVEMENTS
                </div>
                <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                  {resume.awards.map((award, index) => (
                    <li key={index} style={{ fontSize: "11pt", lineHeight: "1.6", marginBottom: "2mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
                      <span style={{ position: "absolute", left: "0" }}>•</span>
                      <strong>{award.title}</strong>
                      {award.when && ` (${award.when})`}
                      {award.purpose && ` - ${award.purpose}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Work Experience */}
            {resume.workExperience.length > 0 && (
              <div data-section="experience" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  WORK EXPERIENCE
                </div>
                <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                  {resume.workExperience.map((exp, index) => (
                    <li key={index} style={{ fontSize: "11pt", lineHeight: "1.6", marginBottom: index < resume.workExperience.length - 1 ? "1mm" : "0", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
                      <span style={{ position: "absolute", left: "0" }}>•</span>
                      {exp.company}
                      {(exp.startDate || exp.endDate) && ` (${formatDateRange(exp.startDate, exp.endDate)})`}
                      {exp.designation && ` as ${exp.designation}`}
                      {exp.location && ` - ${exp.location}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Education */}
            {resume.education.length > 0 && (
              <div data-section="education" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  EDUCATIONAL QUALIFICATIONS
                </div>
                <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                  {resume.education.map((edu, index) => (
                    <li key={index} style={{ fontSize: "11pt", lineHeight: "1.6", marginBottom: "2mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
                      <span style={{ position: "absolute", left: "0" }}>•</span>
                      {edu.degree}
                      {edu.specialization && ` - ${edu.specialization}`}
                      {` - ${edu.college}`}
                      {edu.location && ` / ${edu.location}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
