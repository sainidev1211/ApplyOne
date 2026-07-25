// =============================================================================
// ApplyOne — Database Seed Script
// Populates all tables with realistic sample data for development
// Run: npx prisma db seed
// =============================================================================

import { PrismaClient, UserRole, AccountType, ApplicationStatus,
  EmploymentType, RemoteMode, ResumeStatus, SubscriptionStatus,
  PaymentStatus, PaymentMethod, NotificationType, TicketStatus,
  TicketPriority, TicketCategory, EmployeeStatus, PlanStatus, JobStatus,
  PaymentMethod as PM } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting ApplyOne seed...');

  // ==========================================================================
  // 1. SUBSCRIPTION PLANS (must exist before users)
  // ==========================================================================
  console.log('📦 Seeding subscription plans...');

  const professionalPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'professional' },
    update: {},
    create: {
      slug: 'professional',
      name: 'Professional',
      description: 'Perfect for students and freshers entering the job market.',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      currency: 'INR',
      jobCredits: 10,
      aiCredits: 5,
      resumeCredits: 3,
      atsCredits: 0,
      maxApplications: 60,
      atsEnabled: false,
      features: [
        '50–60 Automated Applications / month',
        '10 Job Credits / month',
        '5 AI Credits / month',
        '3 Resume Uploads',
        'Email Notifications',
        'Basic Dashboard',
      ],
      status: 'ACTIVE',
      displayOrder: 1,
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'premium' },
    update: {},
    create: {
      slug: 'premium',
      name: 'Premium',
      description: 'For freshers ready to accelerate their job hunt.',
      monthlyPrice: 1299,
      yearlyPrice: 12990,
      currency: 'INR',
      jobCredits: 20,
      aiCredits: 15,
      resumeCredits: 5,
      atsCredits: 10,
      maxApplications: 100,
      atsEnabled: true,
      features: [
        '80–100 Automated Applications / month',
        '20 Job Credits / month',
        '15 AI Credits / month',
        '5 Resume Uploads',
        'ATS Score Checker',
        'Priority Support',
        'Advanced Analytics',
      ],
      status: 'ACTIVE',
      displayOrder: 2,
    },
  });

  const elitePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'elite' },
    update: {},
    create: {
      slug: 'elite',
      name: 'Elite',
      description: 'For professionals who want maximum application velocity.',
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      currency: 'INR',
      jobCredits: 30,
      aiCredits: 30,
      resumeCredits: 10,
      atsCredits: 30,
      maxApplications: 150,
      atsEnabled: true,
      features: [
        '150+ Automated Applications / month',
        '30 Job Credits / month',
        '30 AI Credits / month',
        '10 Resume Uploads',
        'ATS Score Checker (unlimited)',
        'Dedicated Account Manager',
        'Full Analytics Dashboard',
        'Priority Application Queue',
      ],
      status: 'ACTIVE',
      displayOrder: 3,
    },
  });

  console.log('  ✅ Plans: Professional, Premium, Elite');

  // ==========================================================================
  // 2. SYSTEM SETTINGS
  // ==========================================================================
  console.log('⚙️  Seeding system settings...');

  const settings = [
    { key: 'max_resume_upload_size_mb', value: '5', description: 'Maximum resume file size in MB', isPublic: true },
    { key: 'supported_resume_formats', value: 'pdf,doc,docx', description: 'Allowed resume file extensions', isPublic: true },
    { key: 'ai_model', value: 'llama3-8b-8192', description: 'Default Groq AI model', isPublic: false },
    { key: 'maintenance_mode', value: 'false', description: 'Put site in maintenance mode', isPublic: true },
    { key: 'support_email', value: 'support@applyone.co', description: 'Support email address', isPublic: true },
    { key: 'max_applications_per_day', value: '20', description: 'Max applications per user per day', isPublic: false },
    { key: 'welcome_message', value: 'Welcome to ApplyOne — your AI-powered job application engine.', description: 'Homepage welcome message', isPublic: true },
  ];

  for (const s of settings) {
    await prisma.systemSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('  ✅ System settings seeded');

  // ==========================================================================
  // 3. USERS
  // ==========================================================================
  console.log('👥 Seeding users...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@applyone.co' },
    update: {},
    create: {
      email: 'admin@applyone.co',
      fullName: 'Admin User',
      phone: '+91-9000000001',
      role: UserRole.ADMIN,
      accountType: AccountType.PROFESSIONAL,
      isActive: true,
      isVerified: true,
      country: 'India',
      city: 'Bangalore',
      timezone: 'Asia/Kolkata',
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@applyone.co' },
    update: {},
    create: {
      email: 'employee@applyone.co',
      fullName: 'Employee User',
      phone: '+91-9000000002',
      role: UserRole.EMPLOYEE,
      accountType: AccountType.PROFESSIONAL,
      isActive: true,
      isVerified: true,
      country: 'India',
      city: 'Mumbai',
      timezone: 'Asia/Kolkata',
    },
  });

  const candidateUser = await prisma.user.upsert({
    where: { email: 'user@applyone.co' },
    update: {},
    create: {
      email: 'user@applyone.co',
      fullName: 'Alex Johnson',
      phone: '+91-9876543210',
      role: UserRole.USER,
      accountType: AccountType.FRESHER,
      hasExperience: true,
      currentCompany: 'TechCorp',
      currentPosition: 'Junior Developer',
      experienceYears: 2,
      bio: 'Passionate frontend developer with experience in React and TypeScript.',
      linkedinUrl: 'https://linkedin.com/in/alex-johnson',
      githubUrl: 'https://github.com/alex-johnson',
      country: 'India',
      city: 'Pune',
      timezone: 'Asia/Kolkata',
      lastMonthlyPackage: 45000,
      noticePeriodDays: 30,
      workAuthorization: 'Authorized to work in India',
      expectedPackages: {
        'Full-time': 70000,
        'Part-time': 35000,
        'Internship': 25000,
      },
      isActive: true,
      isVerified: true,
    },
  });

  console.log('  ✅ Users: admin, employee, user (candidate)');

  // ==========================================================================
  // 4. USER PREFERENCES
  // ==========================================================================
  console.log('⚙️  Seeding user preferences...');

  await prisma.userPreferences.upsert({
    where: { userId: candidateUser.id },
    update: {},
    create: {
      userId: candidateUser.id,
      preferredRoles: ['Frontend Developer', 'React Developer', 'Full Stack Developer'],
      preferredLocations: ['Bangalore', 'Mumbai', 'Pune', 'Remote'],
      preferredIndustries: ['Technology', 'Fintech', 'E-commerce'],
      preferredCompanySize: ['Startup', 'Mid-size'],
      openToRemote: true,
      openToHybrid: true,
      openToOnsite: false,
      employmentTypes: [EmploymentType.FULL_TIME, EmploymentType.CONTRACT],
      minimumSalary: 60000,
      maximumSalary: 120000,
      salaryCurrency: 'INR',
      visaSponsorshipNeeded: false,
      preferredExperience: '1-3 years',
      automationEnabled: true,
      dailyEmailAlerts: true,
      applicationAlerts: true,
    },
  });

  console.log('  ✅ User preferences seeded');

  // ==========================================================================
  // 5. EMPLOYEE PROFILE
  // ==========================================================================
  console.log('👔 Seeding employee...');

  const employee = await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: {},
    create: {
      userId: employeeUser.id,
      employeeCode: 'EMP-001',
      department: 'Application Processing',
      designation: 'Application Specialist',
      joinedAt: new Date('2025-01-15'),
      status: EmployeeStatus.ACTIVE,
      totalApplications: 0,
    },
  });

  console.log('  ✅ Employee seeded (EMP-001)');

  // ==========================================================================
  // 6. RESUME
  // ==========================================================================
  console.log('📄 Seeding resume...');

  const resume = await prisma.resume.upsert({
    where: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      userId: candidateUser.id,
      fileName: 'alex_johnson_resume_v1.pdf',
      storagePath: 'resumes/alex_johnson_resume_v1.pdf',
      publicUrl: 'https://storage.applyone.co/resumes/alex_johnson_resume_v1.pdf',
      fileSize: 245760,
      mimeType: 'application/pdf',
      version: 1,
      isDefault: true,
      status: ResumeStatus.ACTIVE,
    },
  });

  // ==========================================================================
  // 7. RESUME ANALYSIS (ATS Checker results)
  // ==========================================================================
  await prisma.resumeAnalysis.upsert({
    where: { resumeId: resume.id },
    update: {},
    create: {
      resumeId: resume.id,
      atsScore: 79,
      formattingScore: 85,
      keywordScore: 72,
      contactScore: 100,
      impactScore: 60,
      suggestions: [
        'Add quantifiable achievements to your experience bullets',
        'Include Node.js and Jest in your skills section',
        'Use more active verbs: Spearheaded, Optimized, Architected',
      ],
      missingSkills: ['Node.js', 'Jest', 'Webpack', 'Agile Methodologies'],
      matchedKeywords: ['React', 'TypeScript', 'Git', 'Tailwind CSS', 'REST APIs'],
      analysisDate: new Date(),
      modelUsed: 'llama3-8b-8192',
      tokensUsed: 2048,
    },
  });

  console.log('  ✅ Resume & analysis seeded');

  // ==========================================================================
  // 8. COMPANIES
  // ==========================================================================
  console.log('🏢 Seeding companies...');

  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'c0000001-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: 'c0000001-0000-0000-0000-000000000001',
        name: 'Stripe',
        website: 'https://stripe.com',
        industry: 'Fintech',
        size: '1000-5000',
        headquarters: 'San Francisco, USA',
        linkedinUrl: 'https://linkedin.com/company/stripe',
        careerPage: 'https://stripe.com/jobs',
      },
    }),
    prisma.company.upsert({
      where: { id: 'c0000002-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: 'c0000002-0000-0000-0000-000000000002',
        name: 'Linear',
        website: 'https://linear.app',
        industry: 'SaaS',
        size: '51-200',
        headquarters: 'San Francisco, USA',
        careerPage: 'https://linear.app/careers',
      },
    }),
    prisma.company.upsert({
      where: { id: 'c0000003-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: 'c0000003-0000-0000-0000-000000000003',
        name: 'Vercel',
        website: 'https://vercel.com',
        industry: 'Cloud Infrastructure',
        size: '201-500',
        headquarters: 'San Francisco, USA',
        careerPage: 'https://vercel.com/careers',
      },
    }),
    prisma.company.upsert({
      where: { id: 'c0000004-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: 'c0000004-0000-0000-0000-000000000004',
        name: 'Clerk',
        website: 'https://clerk.com',
        industry: 'Developer Tools',
        size: '51-200',
        headquarters: 'New York, USA',
        careerPage: 'https://clerk.com/careers',
      },
    }),
  ]);

  console.log('  ✅ Companies seeded: Stripe, Linear, Vercel, Clerk');

  // ==========================================================================
  // 9. JOBS
  // ==========================================================================
  console.log('💼 Seeding jobs...');

  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: 'j0000001-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: 'j0000001-0000-0000-0000-000000000001',
        companyId: companies[0].id,
        title: 'Software Engineer (Frontend)',
        location: 'San Francisco, USA',
        remoteMode: RemoteMode.HYBRID,
        salaryMin: 120000,
        salaryMax: 180000,
        salaryCurrency: 'USD',
        employmentType: EmploymentType.FULL_TIME,
        experienceRequired: '2-5 years',
        description: 'Build beautiful UIs for Stripe\'s payment products.',
        skills: ['React', 'TypeScript', 'CSS', 'REST APIs'],
        status: JobStatus.ACTIVE,
        sourceName: 'LinkedIn',
        postedAt: new Date('2026-07-01'),
      },
    }),
    prisma.job.upsert({
      where: { id: 'j0000002-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: 'j0000002-0000-0000-0000-000000000002',
        companyId: companies[1].id,
        title: 'Product Designer',
        location: 'Remote',
        remoteMode: RemoteMode.REMOTE,
        salaryMin: 100000,
        salaryMax: 150000,
        salaryCurrency: 'USD',
        employmentType: EmploymentType.FULL_TIME,
        experienceRequired: '3-6 years',
        description: 'Design the future of project management at Linear.',
        skills: ['Figma', 'Prototyping', 'Design Systems'],
        status: JobStatus.ACTIVE,
        sourceName: 'Linear Careers',
        postedAt: new Date('2026-07-05'),
      },
    }),
    prisma.job.upsert({
      where: { id: 'j0000003-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: 'j0000003-0000-0000-0000-000000000003',
        companyId: companies[2].id,
        title: 'Solutions Architect',
        location: 'New York, USA',
        remoteMode: RemoteMode.ONSITE,
        salaryMin: 140000,
        salaryMax: 200000,
        salaryCurrency: 'USD',
        employmentType: EmploymentType.FULL_TIME,
        experienceRequired: '5+ years',
        description: 'Help enterprise clients adopt Vercel\'s deployment platform.',
        skills: ['Next.js', 'Cloud Architecture', 'Node.js'],
        status: JobStatus.ACTIVE,
        sourceName: 'Vercel Careers',
        postedAt: new Date('2026-06-28'),
      },
    }),
    prisma.job.upsert({
      where: { id: 'j0000004-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: 'j0000004-0000-0000-0000-000000000004',
        companyId: companies[3].id,
        title: 'Developer Advocate',
        location: 'New York, USA',
        remoteMode: RemoteMode.HYBRID,
        salaryMin: 110000,
        salaryMax: 160000,
        salaryCurrency: 'USD',
        employmentType: EmploymentType.FULL_TIME,
        experienceRequired: '2-4 years',
        description: 'Educate developers and grow Clerk\'s community.',
        skills: ['React', 'Technical Writing', 'Public Speaking'],
        status: JobStatus.ACTIVE,
        sourceName: 'Clerk Careers',
        postedAt: new Date('2026-06-20'),
      },
    }),
  ]);

  console.log('  ✅ Jobs seeded: 4 positions');

  // ==========================================================================
  // 10. APPLICATIONS (matching Dashboard mockApplications)
  // ==========================================================================
  console.log('📋 Seeding applications...');

  const application1 = await prisma.application.upsert({
    where: { id: 'app00001-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'app00001-0000-0000-0000-000000000001',
      userId: candidateUser.id,
      jobId: jobs[0].id,
      resumeId: resume.id,
      assignedEmployeeId: employee.id,
      status: ApplicationStatus.INTERVIEW,
      appliedAt: new Date('2026-07-10'),
      notes: 'Applied via LinkedIn Easy Apply. Interview scheduled for next week.',
    },
  });

  const application2 = await prisma.application.upsert({
    where: { id: 'app00002-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'app00002-0000-0000-0000-000000000002',
      userId: candidateUser.id,
      jobId: jobs[1].id,
      resumeId: resume.id,
      assignedEmployeeId: employee.id,
      status: ApplicationStatus.APPLIED,
      appliedAt: new Date('2026-07-12'),
      notes: 'Applied via Linear careers portal.',
    },
  });

  const application3 = await prisma.application.upsert({
    where: { id: 'app00003-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'app00003-0000-0000-0000-000000000003',
      userId: candidateUser.id,
      jobId: jobs[2].id,
      resumeId: resume.id,
      assignedEmployeeId: employee.id,
      status: ApplicationStatus.OFFER,
      appliedAt: new Date('2026-07-05'),
      completedAt: new Date('2026-07-20'),
      offerAmount: 150000,
      notes: 'Offer received! Candidate reviewing terms.',
    },
  });

  const application4 = await prisma.application.upsert({
    where: { id: 'app00004-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: 'app00004-0000-0000-0000-000000000004',
      userId: candidateUser.id,
      jobId: jobs[3].id,
      resumeId: resume.id,
      assignedEmployeeId: employee.id,
      status: ApplicationStatus.REJECTED,
      appliedAt: new Date('2026-06-28'),
      completedAt: new Date('2026-07-08'),
      rejectionReason: 'Position filled internally.',
    },
  });

  // Timeline entries
  await prisma.applicationTimeline.createMany({
    skipDuplicates: true,
    data: [
      { applicationId: application1.id, status: ApplicationStatus.PENDING, description: 'Application created and queued.', createdById: candidateUser.id },
      { applicationId: application1.id, status: ApplicationStatus.ASSIGNED, description: 'Assigned to employee EMP-001.', createdById: adminUser.id },
      { applicationId: application1.id, status: ApplicationStatus.APPLIED, description: 'Application submitted via LinkedIn.', createdById: employeeUser.id },
      { applicationId: application1.id, status: ApplicationStatus.INTERVIEW, description: 'Interview invitation received. Date TBD.', createdById: employeeUser.id },
      { applicationId: application3.id, status: ApplicationStatus.PENDING, description: 'Application created and queued.', createdById: candidateUser.id },
      { applicationId: application3.id, status: ApplicationStatus.OFFER, description: 'Offer received: $150,000 USD/year.', createdById: employeeUser.id },
      { applicationId: application4.id, status: ApplicationStatus.REJECTED, description: 'Rejected: Position filled internally.', createdById: employeeUser.id },
    ],
  });

  console.log('  ✅ Applications & timelines seeded: 4 applications');

  // ==========================================================================
  // 11. SUBSCRIPTION (for candidate user - Premium plan)
  // ==========================================================================
  console.log('💳 Seeding subscription...');

  const startDate = new Date('2026-07-23');
  const expiresAt = new Date(startDate);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const subscription = await prisma.subscription.upsert({
    where: { id: 'sub00001-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'sub00001-0000-0000-0000-000000000001',
      userId: candidateUser.id,
      planId: premiumPlan.id,
      startDate,
      expiresAt,
      autoRenew: true,
      remainingJobCredits: 18,
      remainingAiCredits: 12,
      remainingResumeCredits: 4,
      remainingAtsCredits: 8,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  // Payment record
  await prisma.payment.upsert({
    where: { transactionId: 'TXN-749102848-APPLY' },
    update: {},
    create: {
      subscriptionId: subscription.id,
      amount: 1299,
      currency: 'INR',
      paymentMethod: PaymentMethod.CARD,
      transactionId: 'TXN-749102848-APPLY',
      invoiceNumber: 'INV-2026-07-0001',
      status: PaymentStatus.SUCCESS,
      paidAt: startDate,
    },
  });

  console.log('  ✅ Subscription & payment seeded');

  // ==========================================================================
  // 12. NOTIFICATIONS
  // ==========================================================================
  console.log('🔔 Seeding notifications...');

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: candidateUser.id,
        type: NotificationType.APPLICATION,
        title: 'Application Submitted',
        message: 'Your application to Stripe for "Software Engineer (Frontend)" has been submitted successfully.',
        isRead: false,
        actionUrl: '/dashboard',
      },
      {
        userId: candidateUser.id,
        type: NotificationType.APPLICATION,
        title: 'Interview Scheduled',
        message: 'You have an interview invitation from Stripe. Check your email for details.',
        isRead: true,
        readAt: new Date('2026-07-11T10:00:00Z'),
      },
      {
        userId: candidateUser.id,
        type: NotificationType.SUBSCRIPTION,
        title: 'Premium Plan Active',
        message: 'Your Premium plan is now active. You have 20 job credits and 15 AI credits this month.',
        isRead: true,
        readAt: new Date('2026-07-23T09:00:00Z'),
      },
      {
        userId: candidateUser.id,
        type: NotificationType.APPLICATION,
        title: 'Offer Received! 🎉',
        message: 'Congratulations! You have received an offer from Vercel for "Solutions Architect".',
        isRead: false,
      },
      {
        userId: candidateUser.id,
        type: NotificationType.SYSTEM,
        title: 'Welcome to ApplyOne',
        message: 'Your account is set up and ready. Upload your resume and let us handle your job applications.',
        isRead: true,
        readAt: new Date('2026-07-23T08:00:00Z'),
      },
    ],
  });

  console.log('  ✅ Notifications seeded: 5 notifications');

  // ==========================================================================
  // 13. CHAT SESSION & MESSAGES
  // ==========================================================================
  console.log('💬 Seeding chat session...');

  const chatSession = await prisma.chatSession.create({
    data: {
      userId: candidateUser.id,
      title: 'Career Advice — Frontend Roles',
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        sessionId: chatSession.id,
        role: 'user',
        content: 'What are the best strategies to improve my resume for frontend developer roles?',
        promptTokens: 25,
        completionTokens: 0,
        totalTokens: 25,
        modelUsed: 'llama3-8b-8192',
      },
      {
        sessionId: chatSession.id,
        role: 'assistant',
        content: 'Great question! Here are the top strategies to optimize your frontend developer resume:\n\n1. **Quantify achievements** — Instead of "built a dashboard", write "built a dashboard that reduced load time by 40%".\n2. **List relevant technologies** — React, TypeScript, Next.js, REST APIs, Git, CI/CD.\n3. **ATS optimization** — Use keywords from job descriptions.\n4. **Show impact** — Mention team size, project scope, and business outcomes.',
        promptTokens: 25,
        completionTokens: 156,
        totalTokens: 181,
        modelUsed: 'llama3-8b-8192',
      },
    ],
  });

  console.log('  ✅ Chat session & messages seeded');

  // ==========================================================================
  // 14. SUPPORT TICKET
  // ==========================================================================
  console.log('🎫 Seeding support ticket...');

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: candidateUser.id,
      subject: 'Resume upload not working on mobile browser',
      category: TicketCategory.TECHNICAL,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
    },
  });

  await prisma.supportReply.create({
    data: {
      ticketId: ticket.id,
      message: 'Hi Alex, thank you for reaching out! Could you please tell us which browser and device you are using? This will help us reproduce the issue.',
      repliedById: employeeUser.id,
      isStaff: true,
    },
  });

  console.log('  ✅ Support ticket seeded');

  // ==========================================================================
  // 15. ACTIVITY LOGS
  // ==========================================================================
  console.log('📊 Seeding activity logs...');

  await prisma.activityLog.createMany({
    data: [
      { userId: candidateUser.id, action: 'LOGIN', module: 'auth', description: 'User logged in via email/password', ipAddress: '103.45.67.89', browser: 'Chrome', device: 'Desktop' },
      { userId: candidateUser.id, action: 'RESUME_UPLOAD', module: 'resume', description: 'Resume uploaded: alex_johnson_resume_v1.pdf', ipAddress: '103.45.67.89' },
      { userId: candidateUser.id, action: 'ATS_ANALYSIS', module: 'ats', description: 'ATS analysis performed on resume v1', ipAddress: '103.45.67.89' },
      { userId: candidateUser.id, action: 'APPLICATION_CREATED', module: 'application', description: 'Application created for Stripe: Software Engineer (Frontend)', ipAddress: '103.45.67.89' },
      { userId: employeeUser.id, action: 'APPLICATION_UPDATED', module: 'application', description: 'Application status updated to INTERVIEW', ipAddress: '10.0.0.5' },
    ],
  });

  console.log('  ✅ Activity logs seeded: 5 entries');

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n✅ Seed completed successfully!');
  console.log('━'.repeat(50));
  console.log('📋 Seeded:');
  console.log('  • 3 Subscription Plans');
  console.log('  • 7 System Settings');
  console.log('  • 3 Users (Admin, Employee, Candidate)');
  console.log('  • 1 Employee Profile (EMP-001)');
  console.log('  • 1 User Preferences record');
  console.log('  • 1 Resume + 1 Resume Analysis');
  console.log('  • 4 Companies');
  console.log('  • 4 Jobs');
  console.log('  • 4 Applications + 7 Timeline entries');
  console.log('  • 1 Active Subscription + 1 Payment');
  console.log('  • 5 Notifications');
  console.log('  • 1 Chat Session + 2 Messages');
  console.log('  • 1 Support Ticket + 1 Reply');
  console.log('  • 5 Activity Logs');
  console.log('━'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
