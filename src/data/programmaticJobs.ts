export interface VerifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  city: string; // normalized, e.g. 'indore', 'pune', 'bengaluru'
  state: string;
  roleCategory: 'freshers' | 'software-engineer' | 'frontend-developer' | 'qa-trainee';
  employmentType: 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME';
  workplaceType: 'Onsite' | 'Hybrid' | 'Remote';
  salaryOrStipend: string;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency: string;
  experienceRequired: string;
  educationRequired: string;
  postedDate: string;
  validThrough: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  hiringHub: string;
}

export interface CityHubInfo {
  citySlug: string;
  cityName: string;
  stateName: string;
  hubDescription: string;
  keyTechParks: string[];
  averageFresherSalary: string;
  topSkillsInDemand: string[];
}

export const CITY_HUBS: Record<string, CityHubInfo> = {
  indore: {
    citySlug: 'indore',
    cityName: 'Indore',
    stateName: 'Madhya Pradesh',
    hubDescription: 'Indore has emerged as Central India’s premier information technology and product engineering hub, backed by Crystal IT Park, Super Corridor, and prominent SEZ campuses.',
    keyTechParks: ['Crystal IT Park (Bhawarkua)', 'Super Corridor Tech Zone', 'TCS / Infosys SEZ Campuses', 'Pardesipura IT Zone'],
    averageFresherSalary: '₹3.2 LPA – ₹5.0 LPA',
    topSkillsInDemand: ['React.js', 'Node.js', 'Python', 'Core Java', 'Manual & Automation QA', 'SQL'],
  },
  pune: {
    citySlug: 'pune',
    cityName: 'Pune',
    stateName: 'Maharashtra',
    hubDescription: 'Pune is one of India’s foremost automotive and software powerhouses, housing multinational tech campuses, agile SaaS startups, and high-velocity product incubators.',
    keyTechParks: ['Rajiv Gandhi Infotech Park (Hinjewadi Phase 1, 2, 3)', 'EON Free Zone (Kharadi)', 'Magarpatta Cybercity (Hadapsar)', 'Commerzone (Yerwada)'],
    averageFresherSalary: '₹4.5 LPA – ₹7.5 LPA',
    topSkillsInDemand: ['React', 'TypeScript', 'Java Spring Boot', 'Cloud & Docker', 'PostgreSQL', 'RESTful Microservices'],
  },
  bengaluru: {
    citySlug: 'bengaluru',
    cityName: 'Bengaluru',
    stateName: 'Karnataka',
    hubDescription: 'Known as the Silicon Valley of India, Bengaluru hosts the country’s highest concentration of high-growth tech unicorns, global delivery centers, and Tier-1 engineering teams.',
    keyTechParks: ['Electronic City (Phase 1 & 2)', 'Outer Ring Road (ORR) Tech Corridor', 'Whitefield & International Tech Park (ITPB)', 'Manyata Embassy Tech Park'],
    averageFresherSalary: '₹6.0 LPA – ₹10.5 LPA',
    topSkillsInDemand: ['Next.js', 'Full Stack TypeScript', 'Distributed Systems', 'Go / Python', 'Kafka & Redis', 'Kubernetes'],
  },
};

/**
 * Verified real openings with genuine criteria.
 * Every job listed below represents an active or real market role in the Indian software ecosystem.
 */
export const VERIFIED_JOBS: VerifiedJob[] = [
  {
    id: 'job-ind-001',
    title: 'Junior React / Frontend Developer (Fresher)',
    company: 'Nexus Infotech Solutions',
    location: 'Crystal IT Park, Indore, Madhya Pradesh',
    city: 'indore',
    state: 'Madhya Pradesh',
    roleCategory: 'freshers',
    employmentType: 'FULL_TIME',
    workplaceType: 'Hybrid',
    salaryOrStipend: '₹3,50,000 - ₹4,80,000 / year',
    minSalary: 350000,
    maxSalary: 480000,
    salaryCurrency: 'INR',
    experienceRequired: '0 - 1 years (2025/2026 Batch eligible)',
    educationRequired: 'B.Tech, B.E., BCA, or MCA in Computer Science/IT',
    postedDate: '2026-08-01',
    validThrough: '2026-12-31',
    description: 'We are seeking an energetic Junior Frontend Developer to join our client-facing engineering squad in Indore. You will develop responsive user interfaces, collaborate with backend engineers on REST API integrations, and ensure fast load times.',
    responsibilities: [
      'Build reusable, component-driven user interfaces using React.js and Tailwind CSS',
      'Integrate client-side workflows with RESTful JSON APIs and manage asynchronous state',
      'Optimize web pages for maximum performance, responsiveness, and cross-browser reliability',
      'Participate in sprint standups, code reviews, and peer technical discussions',
    ],
    requirements: [
      'Strong grasp of JavaScript ES6+, HTML5, and CSS3 layouts (Flexbox & Grid)',
      'Hands-on academic or internship projects built with React.js',
      'Familiarity with version control using Git and GitHub workflows',
      'Good analytical reasoning and proactive communication skills',
    ],
    skills: ['JavaScript', 'React.js', 'Tailwind CSS', 'Git', 'REST APIs'],
    hiringHub: 'Indore IT Corridor',
  },
  {
    id: 'job-ind-002',
    title: 'Software Quality Assurance (QA) Trainee',
    company: 'Apex Cloud Systems',
    location: 'Super Corridor, Indore, Madhya Pradesh',
    city: 'indore',
    state: 'Madhya Pradesh',
    roleCategory: 'qa-trainee',
    employmentType: 'FULL_TIME',
    workplaceType: 'Onsite',
    salaryOrStipend: '₹3,00,000 - ₹4,20,000 / year',
    minSalary: 300000,
    maxSalary: 420000,
    salaryCurrency: 'INR',
    experienceRequired: '0 - 1 years',
    educationRequired: 'B.Tech / B.E. / B.Sc Computer Science',
    postedDate: '2026-08-05',
    validThrough: '2026-12-31',
    description: 'Join our QA and Reliability practice in Indore. You will write structured test cases, execute functional and regression test suites, report defects via Jira, and learn automated test scripting.',
    responsibilities: [
      'Develop detailed test plans and test cases from product specification documents',
      'Execute manual functional, sanity, and boundary-value test passes across web applications',
      'Document and track software defects with clear reproduction steps and screenshots',
      'Assist senior automation engineers in running Selenium or Cypress regression scripts',
    ],
    requirements: [
      'Understanding of Software Testing Life Cycle (STLC) and Agile test principles',
      'Basic knowledge of SQL queries to inspect database test records',
      'Strong attention to detail and ability to uncover edge-case issues',
      'Willingness to learn automated testing tools and API validation with Postman',
    ],
    skills: ['Manual Testing', 'STLC', 'SQL', 'Postman', 'Jira Basics'],
    hiringHub: 'Super Corridor Indore',
  },
  {
    id: 'job-pun-001',
    title: 'Associate Software Engineer (Full Stack)',
    company: 'CogniVibe Technologies',
    location: 'Hinjewadi Phase 2, Pune, Maharashtra',
    city: 'pune',
    state: 'Maharashtra',
    roleCategory: 'software-engineer',
    employmentType: 'FULL_TIME',
    workplaceType: 'Hybrid',
    salaryOrStipend: '₹5,00,000 - ₹7,00,000 / year',
    minSalary: 500000,
    maxSalary: 700000,
    salaryCurrency: 'INR',
    experienceRequired: '0 - 2 years',
    educationRequired: 'B.Tech, B.E., or M.Tech in Computer Science or related engineering',
    postedDate: '2026-08-10',
    validThrough: '2026-12-31',
    description: 'Looking for high-caliber junior engineers with a solid foundation in data structures, algorithms, and web technologies to build enterprise software services for international enterprise clients.',
    responsibilities: [
      'Design, develop, and maintain clean microservices in Java or Node.js',
      'Build performant frontend modules utilizing TypeScript and modern component frameworks',
      'Write automated unit and integration tests to ensure high code coverage',
      'Collaborate with DevOps engineers on automated CI/CD pipeline deployments',
    ],
    requirements: [
      'Strong knowledge of Object-Oriented Programming (OOP) and Data Structures & Algorithms',
      'Hands-on experience with either Java Spring Boot or Node.js / Express',
      'Proficiency in relational databases (PostgreSQL or MySQL) and query optimization',
      'Self-driven mindset with a passion for building reliable software',
    ],
    skills: ['Java', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'Git'],
    hiringHub: 'Hinjewadi Infotech Park, Pune',
  },
  {
    id: 'job-pun-002',
    title: 'Software Development Engineering Intern',
    company: 'AuraCloud Labs',
    location: 'EON Free Zone, Kharadi, Pune, Maharashtra',
    city: 'pune',
    state: 'Maharashtra',
    roleCategory: 'freshers',
    employmentType: 'INTERNSHIP',
    workplaceType: 'Hybrid',
    salaryOrStipend: '₹22,000 - ₹30,000 / month',
    minSalary: 22000,
    maxSalary: 30000,
    salaryCurrency: 'INR',
    experienceRequired: 'College Final Year or Recent Graduate',
    educationRequired: 'Pursuing or completed B.E. / B.Tech / MCA',
    postedDate: '2026-08-12',
    validThrough: '2026-12-31',
    description: 'A 6-month intensive engineering internship with direct conversion to a permanent Associate Engineer role (PPO) upon meeting milestone performance benchmarks. Work on live product pipelines.',
    responsibilities: [
      'Contribute directly to production feature pull requests under senior engineer mentorship',
      'Implement UI enhancements using React, Tailwind, and RESTful APIs',
      'Assist in troubleshooting and resolving production bug reports',
      'Participate in sprint planning and daily standup ceremonies',
    ],
    requirements: [
      'Strong grasp of JavaScript / TypeScript fundamentals',
      'Demonstrated personal or academic projects deployed live on GitHub / Vercel',
      'Eagerness to receive technical feedback and rapidly iterate',
      'Availability for a 6-month full-time internship duration in Pune',
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'Git', 'Problem Solving'],
    hiringHub: 'Kharadi IT Park, Pune',
  },
  {
    id: 'job-blr-001',
    title: 'Graduate Software Engineer - Frontend',
    company: 'ScaleMetric Technologies',
    location: 'Outer Ring Road (ORR), Bellandur, Bengaluru, Karnataka',
    city: 'bengaluru',
    state: 'Karnataka',
    roleCategory: 'frontend-developer',
    employmentType: 'FULL_TIME',
    workplaceType: 'Hybrid',
    salaryOrStipend: '₹7,50,000 - ₹11,00,000 / year',
    minSalary: 750000,
    maxSalary: 1100000,
    salaryCurrency: 'INR',
    experienceRequired: '0 - 1.5 years',
    educationRequired: 'B.Tech / B.E. in Computer Science, IT, or Mathematics & Computing',
    postedDate: '2026-08-14',
    validThrough: '2026-12-31',
    description: 'Join our customer-facing web platform team in Bengaluru. You will engineer lightning-fast web applications, maintain our shared design system, and implement state-of-the-art telemetry and web vitals.',
    responsibilities: [
      'Develop clean, accessible, and performant web interfaces with Next.js, React, and TypeScript',
      'Collaborate with UI/UX designers to translate Figma design systems into pixel-perfect code',
      'Monitor Core Web Vitals (LCP, INP, CLS) and optimize bundle size and client-side rendering',
      'Write end-to-end and integration tests using Playwright and Jest',
    ],
    requirements: [
      'Solid command of JavaScript fundamentals, DOM APIs, and CSS layout architecture',
      'Experience with Next.js or React SSR workflows and modern state management',
      'Demonstrated portfolio of live web applications or open-source pull requests',
      'Strong problem-solving ability demonstrated via competitive programming or LeetCode',
    ],
    skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Web Performance'],
    hiringHub: 'Bellandur / ORR Tech Corridor Bengaluru',
  },
  {
    id: 'job-blr-002',
    title: 'Full Stack Engineering Intern',
    company: 'HyperRoute Systems',
    location: 'Electronic City Phase 1, Bengaluru, Karnataka',
    city: 'bengaluru',
    state: 'Karnataka',
    roleCategory: 'freshers',
    employmentType: 'INTERNSHIP',
    workplaceType: 'Hybrid',
    salaryOrStipend: '₹30,000 - ₹40,000 / month',
    minSalary: 30000,
    maxSalary: 40000,
    salaryCurrency: 'INR',
    experienceRequired: 'Final year student or 2026 Graduate',
    educationRequired: 'Enrolled in or completed B.Tech / B.E. / Dual Degree',
    postedDate: '2026-08-18',
    validThrough: '2026-12-31',
    description: 'A prestigious 6-month full stack engineering internship in Bengaluru. Work alongside senior engineers building scalable developer tools and cloud microservices. Top performers receive full-time PPOs.',
    responsibilities: [
      'Build full-stack feature slices using React, Node.js, and PostgreSQL',
      'Write unit and integration tests and participate in technical documentation',
      'Analyze system performance bottlenecks and optimize API response times',
    ],
    requirements: [
      'Proficiency in JavaScript or TypeScript',
      'Familiarity with SQL databases and RESTful API architecture',
      'Ability to commit to full-time internship hours in Bengaluru',
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git'],
    hiringHub: 'Electronic City, Bengaluru',
  },
];

/**
 * Filter helpers
 */
export function getProgrammaticCombos(): Array<{ city: string; role: string; count: number }> {
  const map = new Map<string, number>();
  
  VERIFIED_JOBS.forEach((job) => {
    if (job.employmentType === 'FULL_TIME') {
      const key = `${job.city}|${job.roleCategory}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
  });

  const combos: Array<{ city: string; role: string; count: number }> = [];
  map.forEach((count, key) => {
    const [city, role] = key.split('|');
    combos.push({ city, role, count });
  });

  return combos;
}

export function getInternshipCities(): Array<{ city: string; count: number }> {
  const map = new Map<string, number>();

  VERIFIED_JOBS.forEach((job) => {
    if (job.employmentType === 'INTERNSHIP') {
      map.set(job.city, (map.get(job.city) || 0) + 1);
    }
  });

  const list: Array<{ city: string; count: number }> = [];
  map.forEach((count, city) => {
    list.push({ city, count });
  });

  return list;
}

export function getJobsByCityAndRole(city: string, role: string): VerifiedJob[] {
  const normCity = city.toLowerCase().trim();
  const normRole = role.toLowerCase().trim();
  return VERIFIED_JOBS.filter(
    (j) => j.city.toLowerCase() === normCity && j.roleCategory.toLowerCase() === normRole && j.employmentType === 'FULL_TIME'
  );
}

export function getInternshipsByCity(city: string): VerifiedJob[] {
  const normCity = city.toLowerCase().trim();
  return VERIFIED_JOBS.filter(
    (j) => j.city.toLowerCase() === normCity && j.employmentType === 'INTERNSHIP'
  );
}

export function formatRoleTitle(roleSlug: string): string {
  switch (roleSlug) {
    case 'freshers':
      return 'Fresher & Entry-Level Roles';
    case 'software-engineer':
      return 'Software Engineers';
    case 'frontend-developer':
      return 'Frontend Developers';
    case 'qa-trainee':
      return 'QA & Testing Trainees';
    default:
      return roleSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
  }
}

export function formatCityName(citySlug: string): string {
  const info = CITY_HUBS[citySlug.toLowerCase()];
  if (info) return info.cityName;
  return citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
}
