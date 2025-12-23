import { Resume, Project, WorkExperience, Education, Blog, Certification, Award } from "../types/resume";
import { COLUMN_INDEXES } from "../constants/resumeTemplates";

export class ResumeMapper {
  static mapSheetDataToResume(rows: string[][]): Resume {
    // Start from row 3
    const dataRows = rows.slice(2).filter((row) => 
      row.some((cell) => cell && cell.toString().trim() !== "")
    );

    if (dataRows.length === 0) {
      throw new Error("No data found in sheet");
    }

    // Get personal info from first data row
    const firstRow = dataRows[0];
    const personalInfo = {
      name: firstRow[COLUMN_INDEXES.NAME]?.toString().trim() || "",
      designation: firstRow[COLUMN_INDEXES.PERSONAL_DESIGNATION]?.toString().trim() || undefined,
      company: firstRow[COLUMN_INDEXES.CURRENT_COMPANY]?.toString().trim() || undefined,
      email: firstRow[COLUMN_INDEXES.EMAIL]?.toString().trim() || undefined,
    };

    const objective = firstRow[COLUMN_INDEXES.OBJECTIVE]?.toString().trim() || "";
    const summary: string[] = [];
    const technicalSkills: { [category: string]: string[] } = {};
    const projects: Project[] = [];
    const workExperience: WorkExperience[] = [];
    const education: Education[] = [];
    const blogs: Blog[] = [];
    const certifications: Certification[] = [];
    const awards: Award[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as string[];

      const summaryText = row[COLUMN_INDEXES.SUMMARY]?.toString().trim();
      if (summaryText) {
        summary.push(summaryText);
      }

      // Skills
      const skillGroup = row[COLUMN_INDEXES.SKILL_GROUP]?.toString().trim();
      const skillName = row[COLUMN_INDEXES.SKILL_NAME]?.toString().trim();
      if (skillGroup && skillName) {
        if (!technicalSkills[skillGroup]) {
          technicalSkills[skillGroup] = [];
        }
        if (!technicalSkills[skillGroup].includes(skillName)) {
          technicalSkills[skillGroup].push(skillName);
        }
      }

      // Projects
      const projectName = row[COLUMN_INDEXES.PROJECT_NAME]?.toString().trim();
      const role = row[COLUMN_INDEXES.ROLE]?.toString().trim();
      const techStack = row[COLUMN_INDEXES.TECHSTACK]?.toString().trim();
      const projectDesc = row[COLUMN_INDEXES.PROJECT_DESCRIPTION]?.toString().trim();
      const responsibility = row[COLUMN_INDEXES.ROLES_RESPONIBILITIES]?.toString().trim();

      if (projectName) {
        const project: Project = {
          name: projectName,
          role: role || undefined,
          techStack: techStack ? techStack.split(",").map(t => t.trim()).filter(t => t) : undefined,
          description: projectDesc || undefined,
          responsibilities: responsibility ? [responsibility] : [],
        };
        projects.push(project);
      } else if (responsibility && projects.length > 0) {
        const lastProject = projects[projects.length - 1];
        if (!lastProject.responsibilities) {
          lastProject.responsibilities = [];
        }
        lastProject.responsibilities.push(responsibility);
      }

      // Work Experience
      const designation = row[COLUMN_INDEXES.DESIGNATION]?.toString().trim();
      const companyName = row[COLUMN_INDEXES.COMPANY_NAME]?.toString().trim();
      const companyLocation = row[COLUMN_INDEXES.COMPANY_LOCATION]?.toString().trim();
      const startDate = row[COLUMN_INDEXES.START_DATE]?.toString().trim();
      const endDate = row[COLUMN_INDEXES.END_DATE]?.toString().trim();

      if (designation && companyName) {
        const exp: WorkExperience = {
          designation,
          company: companyName,
          location: companyLocation || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        };
        workExperience.push(exp);
      }

      // Education
      const degree = row[COLUMN_INDEXES.DEGREE]?.toString().trim();
      const specialization = row[COLUMN_INDEXES.SPECIALIZATION]?.toString().trim();
      const collegeName = row[COLUMN_INDEXES.COLLEGE_NAME]?.toString().trim();
      const collegeLocation = row[COLUMN_INDEXES.COLLEGE_LOCATION]?.toString().trim();
      const startYear = row[COLUMN_INDEXES.START_YEAR]?.toString().trim();
      const completionYear = row[COLUMN_INDEXES.COMPLETION_YEAR]?.toString().trim();

      if (degree && collegeName) {
        const edu: Education = {
          degree,
          specialization: specialization || undefined,
          college: collegeName,
          location: collegeLocation || undefined,
          startYear: startYear || undefined,
          completionYear: completionYear || undefined,
        };
        education.push(edu);
      }

      // Blogs And Articles
      const blogTitle = row[COLUMN_INDEXES.BLOG_TITLE]?.toString().trim();
      if (blogTitle) {
        const blogCategory = row[COLUMN_INDEXES.BLOG_CATEGORY]?.toString().trim();
        const blogUrl = row[COLUMN_INDEXES.BLOG_URL]?.toString().trim();
        const blog: Blog = {
          category: blogCategory || undefined,
          title: blogTitle,
          url: blogUrl || undefined,
        };
        blogs.push(blog);
      }

      // Certifications
      const certificationName = row[COLUMN_INDEXES.CERTIFICATION_NAME]?.toString().trim();
      if (certificationName) {
        const certificateId = row[COLUMN_INDEXES.CERTIFICATE_ID]?.toString().trim();
        const certificateUrl = row[COLUMN_INDEXES.CERTIFICATE_URL]?.toString().trim();
        const cert: Certification = {
          name: certificationName,
          id: certificateId || undefined,
          url: certificateUrl || undefined,
        };
        certifications.push(cert);
      }

      // Awards & Achievements
      const awardTitle = row[COLUMN_INDEXES.AWARD_TITLE]?.toString().trim();
      if (awardTitle) {
        const awardPurpose = row[COLUMN_INDEXES.AWARD_PURPOSE]?.toString().trim();
        const awardWhen = row[COLUMN_INDEXES.AWARD_WHEN]?.toString().trim();
        const award: Award = {
          title: awardTitle,
          purpose: awardPurpose || undefined,
          when: awardWhen || undefined,
        };
        awards.push(award);
      }
    }

    return {
      personalInfo,
      objective: objective || undefined,
      summary,
      technicalSkills,
      projects,
      workExperience,
      education,
      blogs,
      certifications,
      awards,
    };
  }
}

