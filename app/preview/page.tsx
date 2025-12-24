"use client";

import React, { useEffect, useState, useRef } from "react";
import { Resume, Blog } from "@/app/lib/types/resume";
import { Button } from "@/components/ui/button";

export default function PreviewPage() {
    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const resumeContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Get resume data.
        try {
            const resumeData = sessionStorage.getItem("resumeData");
            if (resumeData) {
                const parsedResume = JSON.parse(resumeData) as Resume;
                setResume(parsedResume);
                setLoading(false);
            } else {
                setError("No resume data found. Please generate a resume first.");
                setLoading(false);
            }
        } catch {
            setError("Failed to parse resume data");
            setLoading(false);
        }
    }, []);

    const handlePrint = async () => {
        if (!resumeContainerRef.current) return;

        setGeneratingPdf(true);
        try {
            const element = resumeContainerRef.current;

            // Get the inner HTML of the resume container
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
            a.download = "resume.pdf";
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

            <div className="min-h-screen bg-gray-100 py-8">
                <div className="container mx-auto px-4">
                    <div className="mb-4 flex justify-between items-center no-print">
                        <h1 className="text-2xl font-bold">Resume Preview</h1>
                        <Button onClick={handlePrint} disabled={generatingPdf}>
                            {generatingPdf ? "Generating PDF..." : "Save as PDF"}
                        </Button>
                    </div>

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
                        <div style={{ marginBottom: "8mm" }}>
                            <h1 style={{ fontSize: "18pt", fontWeight: "bold", color: "#000000" }}>
                                {resume.personalInfo.name}
                            </h1>
                            {resume.personalInfo.designation && (
                                <div style={{ fontSize: "11pt", color: "#333333" }}>
                                    <strong>{resume.personalInfo.designation}</strong>
                                </div>
                            )}
                            {resume.personalInfo.company && (
                                <div style={{ fontSize: "11pt", color: "#555555" }}>
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

                                            const allRows: Array<{ category: string; blog: Blog; blogIndex: number; categoryIndex: number }> = [];
                                            Object.entries(groupedBlogs).forEach(([category, blogs]) => {
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
                    </div>
                </div>
            </div>
        </>
    );
}
