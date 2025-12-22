"use client";

import { useEffect, useState } from "react";
import { Resume } from "@/app/lib/types/resume";
import { Button } from "@/components/ui/button";

export default function PreviewPage() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get resume data from sessionStorage
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

  const handlePrint = () => {
    window.print();
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

  const formatEducationDate = (startYear?: string, completionYear?: string) => {
    if (!startYear && !completionYear) return "";
    if (startYear && completionYear) return `${startYear} - ${completionYear}`;
    return completionYear || startYear || "";
  };

  return (
    <>
      {/* Print styles */}
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
            <Button onClick={handlePrint}>
              Print / Save as PDF
            </Button>
          </div>

          {/* Resume HTML Container */}
          <div
            className="resume-container bg-white"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "20mm",
              margin: "0 auto",
              backgroundColor: "#ffffff",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "10pt",
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
                <div style={{ fontSize: "10pt", color: "#555555" }}>
                  <strong>{resume.personalInfo.company}</strong>
                </div>
              )}
            </div>

            {/* Objective */}
            {resume.objective && (
              <div style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  OBJECTIVE
                </div>
                <p style={{ fontSize: "10pt", lineHeight: "1.6", textAlign: "justify", margin: "0", color: "#000000" }}>
                  {resume.objective}
                </p>
              </div>
            )}

            {/* Summary */}
            {resume.summary.length > 0 && (
              <div style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  SUMMARY
                </div>
                <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                  {resume.summary.map((item, index) => (
                    <li key={index} style={{ fontSize: "10pt", lineHeight: "1.6", marginBottom: "2mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
                      <span style={{ position: "absolute", left: "0" }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Skills */}
            {Object.keys(resume.technicalSkills).length > 0 && (
              <div style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  TECHNICAL SKILLS
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", margin: "0" }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: "10pt", fontWeight: "bold", textAlign: "left", padding: "2mm", borderBottom: "1px solid #000000", color: "#000000" }}>
                        Skill Category
                      </th>
                      <th style={{ fontSize: "10pt", fontWeight: "bold", textAlign: "left", padding: "2mm", borderBottom: "1px solid #000000", color: "#000000" }}>
                        Skills/Tools
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(resume.technicalSkills).map(([category, skills], index) => (
                      <tr key={index}>
                        <td style={{ fontSize: "10pt", padding: "2mm", borderBottom: "1px solid #dddddd", color: "#000000" }}>
                          {category}
                        </td>
                        <td style={{ fontSize: "10pt", padding: "2mm", borderBottom: "1px solid #dddddd", color: "#000000" }}>
                          {skills.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Projects */}
            {resume.projects.length > 0 && (
              <div className="page-break" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  PROJECTS
                </div>
                {resume.projects.map((project, index) => (
                  <div key={index} style={{ marginBottom: "6mm" }}>
                    <div style={{ marginBottom: "2mm" }}>
                      {project.name && (
                        <div style={{ fontSize: "10pt", color: "#000000" }}>
                          <strong style={{ color: "#000000" }}>Project Name:</strong> {project.name}
                        </div>
                      )}
                      {project.role && (
                        <div style={{ fontSize: "10pt", color: "#000000" }}>
                          <strong style={{ color: "#000000" }}>Role:</strong> {project.role}
                        </div>
                      )}
                      {project.techStack && project.techStack.length > 0 && (
                        <div style={{ fontSize: "10pt", color: "#000000" }}>
                          <strong style={{ color: "#000000" }}>Tech Stack:</strong> {project.techStack.join(", ")}
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <div style={{ fontSize: "10pt", lineHeight: "1.6", color: "#000000" }}>
                        <strong style={{ color: "#000000" }}>Description:</strong> {project.description}
                      </div>
                    )}
                    {project.responsibilities.length > 0 && (
                      <div>
                        <strong style={{ color: "#000000" }}>Role & Responsibility:</strong>
                        <ul style={{ listStyle: "none", padding: "0" }}>
                          {project.responsibilities.map((resp, respIndex) => (
                            <li key={respIndex} style={{ fontSize: "10pt", lineHeight: "1.5", marginBottom: "1mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
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
              <div className="page-break" style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  WORK EXPERIENCE
                </div>
                {resume.workExperience.map((exp, index) => (
                  <div key={index} style={{ marginBottom: "2mm" }}>
                    <div style={{ marginBottom: "2mm" }}>
                      <div style={{ fontSize: "11pt", fontWeight: "bold", marginBottom: "0", color: "#000000" }}>
                        {exp.designation} at {exp.company}
                      </div>
                      {exp.location && (
                        <div style={{ fontSize: "10pt", color: "#555555" }}>
                          {exp.location}
                        </div>
                      )}
                      {(exp.startDate || exp.endDate) && (
                        <div style={{ fontSize: "10pt", color: "#555555", marginBottom: "1mm" }}>
                          {formatDateRange(exp.startDate, exp.endDate)}
                        </div>
                      )}
                    </div>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <div>
                        <strong style={{ color: "#000000" }}>Role & Responsibility:</strong>
                        <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                          {exp.responsibilities.map((resp, respIndex) => (
                            <li key={respIndex} style={{ fontSize: "10pt", lineHeight: "1.6", marginBottom: "2mm", paddingLeft: "5mm", position: "relative", color: "#000000" }}>
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

            {/* Education */}
            {resume.education.length > 0 && (
              <div style={{ marginBottom: "8mm" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4mm 0", paddingBottom: "2mm", borderBottom: "1px solid #000000" }}>
                  EDUCATION & CERTIFICATION
                </div>
                {resume.education.map((edu, index) => (
                  <div key={index} style={{ marginBottom: "5mm" }}>
                    <div>
                      <div style={{ fontSize: "11pt", fontWeight: "bold", margin: "0", color: "#000000" }}>
                        {edu.degree}
                        {edu.specialization && ` - ${edu.specialization}`}
                      </div>
                      <div style={{ fontSize: "10pt", color: "#555555", margin: "1mm 0" }}>
                        {edu.college}
                      </div>
                      {edu.location && (
                        <div style={{ fontSize: "10pt", color: "#555555", margin: "1mm 0" }}>
                          {edu.location}
                        </div>
                      )}
                      {(edu.startYear || edu.completionYear) && (
                        <div style={{ fontSize: "10pt", color: "#555555", margin: "1mm 0" }}>
                          {formatEducationDate(edu.startYear, edu.completionYear)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
