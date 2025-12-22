export interface Resume {
  personalInfo: {
    name: string;
    designation?: string;
    company?: string;
    email?: string;
    location?: string;
  };
  objective?: string;
  summary: string[];
  technicalSkills: {
    [category: string]: string[];
  };
  projects: Project[];
  workExperience: WorkExperience[];
  education: Education[];
}

export interface Project {
  name: string;
  role?: string;
  techStack?: string[];
  description?: string;
  responsibilities: string[];
}

export interface WorkExperience {
  designation: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string[];
}

export interface Education {
  degree: string;
  specialization?: string;
  college: string;
  location?: string;
  startYear?: string;
  completionYear?: string;
}

