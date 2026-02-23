import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../modules/auth/auth.model.js";
import Job from "../modules/jobs/jobs.model.js";
import Application from "../modules/candidates/application.model.js";
import Interview from "../modules/interviews/interviews.model.js";

await connectDB();

const seed = async () => {
  try {
    console.log("🧹 Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Interview.deleteMany({}),
    ]);

    const hashedPass = await bcrypt.hash("password123", 12);

    // ─── Recruiters ─────────────────────────────────────────────────────────
    console.log("👔 Seeding recruiters...");
    const recruiters = await User.insertMany([
      {
        name: "Sarah Chen",
        email: "sarah@techcorp.io",
        password: hashedPass,
        role: "recruiter",
        organization: "TechCorp Inc.",
        organizationId: "techcorp",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      },
      {
        name: "Marcus Williams",
        email: "marcus@innovatelabs.io",
        password: hashedPass,
        role: "recruiter",
        organization: "Innovate Labs",
        organizationId: "innovatelabs",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
      },
    ]);

    // ─── Candidates ──────────────────────────────────────────────────────────
    console.log("👨‍💻 Seeding candidates...");
    const candidates = await User.insertMany([
      {
        name: "Alex Johnson",
        email: "alex@email.com",
        password: hashedPass,
        role: "candidate",
        title: "Senior React Developer",
        skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS", "Docker"],
        experience: 5,
        location: "San Francisco, CA",
        bio: "Passionate full-stack developer with 5 years of experience building scalable web applications.",
        linkedinUrl: "https://linkedin.com/in/alexj",
        githubUrl: "https://github.com/alexj",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      },
      {
        name: "Priya Sharma",
        email: "priya@email.com",
        password: hashedPass,
        role: "candidate",
        title: "ML Engineer",
        skills: ["Python", "PyTorch", "TensorFlow", "MLOps", "AWS", "Kubernetes", "SQL"],
        experience: 4,
        location: "New York, NY",
        bio: "ML Engineer specializing in production ML systems and LLM fine-tuning.",
        linkedinUrl: "https://linkedin.com/in/priya",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      },
      {
        name: "Jake Martinez",
        email: "jake@email.com",
        password: hashedPass,
        role: "candidate",
        title: "DevOps Engineer",
        skills: ["Kubernetes", "Terraform", "Docker", "CI/CD", "AWS", "Prometheus"],
        experience: 6,
        location: "Austin, TX",
        bio: "DevOps expert with deep expertise in cloud-native infrastructure and GitOps.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jake",
      },
      {
        name: "Emma Wilson",
        email: "emma@email.com",
        password: hashedPass,
        role: "candidate",
        title: "Product Designer",
        skills: ["Figma", "UX Research", "Prototyping", "Design Systems", "User Testing"],
        experience: 3,
        location: "Remote",
        bio: "Product designer passionate about creating accessible and delightful user experiences.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      },
      {
        name: "David Kim",
        email: "david@email.com",
        password: hashedPass,
        role: "candidate",
        title: "Backend Engineer",
        skills: ["Node.js", "Python", "MongoDB", "PostgreSQL", "Redis", "REST APIs"],
        experience: 3,
        location: "Seattle, WA",
        bio: "Backend engineer who loves building robust APIs and distributed systems.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      },
      {
        name: "Lisa Park",
        email: "lisa@email.com",
        password: hashedPass,
        role: "candidate",
        title: "Frontend Developer",
        skills: ["Vue.js", "React", "CSS", "JavaScript", "TypeScript", "Webpack"],
        experience: 2,
        location: "Chicago, IL",
        bio: "Frontend developer focused on performance optimization and accessibility.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
      },
    ]);

    // ─── Jobs ────────────────────────────────────────────────────────────────
    console.log("💼 Seeding jobs...");
    const jobs = await Job.insertMany([
      {
        title: "Senior React Developer",
        description: "We're looking for a Senior React Developer to join our product team. You'll build high-performance web applications, mentor junior developers, and work closely with our design and backend teams. Experience with TypeScript and GraphQL is essential. You'll own key features from design to deployment.",
        requirements: "5+ years of React experience. Strong TypeScript skills. Experience with state management (Redux/Zustand). Understanding of performance optimization. GraphQL knowledge preferred.",
        responsibilities: "Lead frontend architecture decisions. Build reusable component libraries. Code review and mentoring. Collaborate with product and design teams.",
        requiredSkills: ["React", "TypeScript", "Node.js", "GraphQL"],
        niceToHaveSkills: ["AWS", "Docker", "Testing"],
        department: "Engineering",
        type: "Full-time",
        location: "Remote",
        salaryMin: 120000,
        salaryMax: 160000,
        experienceMin: 4,
        experienceMax: 10,
        status: "Active",
        recruiterId: recruiters[0]._id,
        organization: "TechCorp Inc.",
        applicantsCount: 47,
      },
      {
        title: "ML Engineer",
        description: "Join our AI team to build and deploy machine learning models at scale. You'll work on recommendation systems, NLP pipelines, and LLM-powered features. MLOps experience is critical — you'll own the full ML lifecycle from experimentation to production deployment.",
        requirements: "4+ years ML experience. Proficiency in PyTorch or TensorFlow. MLOps and model deployment experience. Strong Python skills. AWS/GCP cloud experience.",
        responsibilities: "Design and train ML models. Build MLOps pipelines. Collaborate with data engineers. Monitor model performance in production.",
        requiredSkills: ["Python", "PyTorch", "MLOps", "AWS", "Kubernetes"],
        niceToHaveSkills: ["LLM Fine-tuning", "Ray", "Spark"],
        department: "AI/Research",
        type: "Full-time",
        location: "Hybrid",
        salaryMin: 140000,
        salaryMax: 185000,
        experienceMin: 3,
        experienceMax: 8,
        status: "Active",
        recruiterId: recruiters[0]._id,
        organization: "TechCorp Inc.",
        applicantsCount: 63,
      },
      {
        title: "DevOps / Platform Engineer",
        description: "We need a Platform Engineer to own our cloud infrastructure. You'll design and maintain Kubernetes clusters, build CI/CD pipelines, and ensure 99.99% uptime. This is a hands-on role — you'll write Terraform, debug production incidents, and build developer tooling.",
        requirements: "5+ years DevOps experience. Expert Kubernetes skills. Terraform/IaC proficiency. AWS or GCP expertise. Strong bash/Python scripting.",
        responsibilities: "Manage cloud infrastructure. Build and maintain CI/CD. Incident response and on-call. Developer productivity tooling.",
        requiredSkills: ["Kubernetes", "Terraform", "Docker", "AWS", "CI/CD"],
        niceToHaveSkills: ["Prometheus", "Grafana", "ArgoCD"],
        department: "Infrastructure",
        type: "Full-time",
        location: "Remote",
        salaryMin: 130000,
        salaryMax: 165000,
        experienceMin: 5,
        experienceMax: 10,
        status: "Active",
        recruiterId: recruiters[1]._id,
        organization: "Innovate Labs",
        applicantsCount: 38,
      },
      {
        title: "Product Designer",
        description: "We're hiring a talented Product Designer to shape the UX of our B2B SaaS platform. You'll run user research, create wireframes, build prototypes, and maintain our design system. You'll work closely with product managers and engineers in an agile environment.",
        requirements: "3+ years product design experience. Figma expert. Portfolio showing end-to-end design process. User research skills. Experience with design systems.",
        responsibilities: "Lead product design for 2-3 core features. Conduct user interviews and usability tests. Maintain and evolve design system.",
        requiredSkills: ["Figma", "UX Research", "Prototyping", "Design Systems"],
        niceToHaveSkills: ["Motion Design", "HTML/CSS", "Framer"],
        department: "Design",
        type: "Full-time",
        location: "On-site",
        salaryMin: 95000,
        salaryMax: 130000,
        experienceMin: 2,
        experienceMax: 6,
        status: "Active",
        recruiterId: recruiters[1]._id,
        organization: "Innovate Labs",
        applicantsCount: 29,
      },
      {
        title: "Backend Node.js Engineer",
        description: "Build the APIs that power millions of users. You'll design RESTful and GraphQL APIs, optimize database queries, and build microservices. We use Node.js, MongoDB, Redis, and AWS. You'll own backend features end-to-end.",
        requirements: "3+ years Node.js experience. MongoDB and PostgreSQL. REST API design. Redis caching. AWS deployment experience.",
        requiredSkills: ["Node.js", "MongoDB", "PostgreSQL", "Redis", "REST APIs"],
        niceToHaveSkills: ["GraphQL", "Docker", "TypeScript"],
        department: "Engineering",
        type: "Full-time",
        location: "Remote",
        salaryMin: 100000,
        salaryMax: 140000,
        experienceMin: 2,
        experienceMax: 7,
        status: "Active",
        recruiterId: recruiters[0]._id,
        organization: "TechCorp Inc.",
        applicantsCount: 52,
      },
      {
        title: "Frontend Vue.js Developer",
        description: "Join our frontend team to build modern, performant web interfaces using Vue.js 3. Experience with Nuxt.js, TypeScript, and component libraries is a plus. You'll work on consumer-facing products with millions of users.",
        requiredSkills: ["Vue.js", "JavaScript", "CSS", "TypeScript"],
        niceToHaveSkills: ["Nuxt.js", "Tailwind CSS", "Testing"],
        department: "Engineering",
        type: "Contract",
        location: "Remote",
        salaryMin: 80000,
        salaryMax: 110000,
        experienceMin: 2,
        experienceMax: 5,
        status: "Active",
        recruiterId: recruiters[1]._id,
        organization: "Innovate Labs",
        description: "We're looking for a Vue.js developer to join our growing frontend team. You'll build reusable components, optimize performance, and ship features that delight users.",
        applicantsCount: 24,
      },
    ]);

    // ─── Applications ────────────────────────────────────────────────────────
    console.log("📋 Seeding applications...");
    const applications = await Application.insertMany([
      {
        jobId: jobs[0]._id,
        candidateId: candidates[0]._id, // Alex - Senior React Dev applying to React job
        status: "Interview",
        coverLetter: "I'm a passionate React developer with 5 years of experience building scalable applications. I've led frontend architecture at my current company and am excited about this opportunity.",
        matchScore: 92,
        aiAnalysis: {
          score: 88,
          strengths: ["Strong React expertise", "TypeScript proficiency", "GraphQL experience", "AWS knowledge"],
          missingSkills: [],
          summary: "Excellent candidate. Strong match for all required skills with 5 years experience.",
          status: "done",
          analyzedAt: new Date(),
        },
        rating: 5,
      },
      {
        jobId: jobs[0]._id,
        candidateId: candidates[4]._id, // David applying to React job (partial match)
        status: "Shortlisted",
        coverLetter: "While my background is in backend, I've been transitioning to full-stack and have been building React apps for the past year.",
        matchScore: 55,
        aiAnalysis: {
          score: 52,
          strengths: ["Node.js backend expertise", "API design skills"],
          missingSkills: ["TypeScript", "GraphQL", "React at scale"],
          summary: "Partial match. Strong backend skills but limited React experience for senior role.",
          status: "done",
          analyzedAt: new Date(),
        },
        rating: 3,
      },
      {
        jobId: jobs[0]._id,
        candidateId: candidates[5]._id, // Lisa applying to React job
        status: "Applied",
        coverLetter: "I have strong React knowledge and am eager to grow into a senior role.",
        matchScore: 68,
        aiAnalysis: {
          score: 65,
          strengths: ["React skills", "CSS expertise", "TypeScript basics"],
          missingSkills: ["GraphQL", "Node.js", "AWS"],
          summary: "Solid candidate. Missing some senior-level requirements but shows strong growth potential.",
          status: "done",
          analyzedAt: new Date(),
        },
      },
      {
        jobId: jobs[1]._id,
        candidateId: candidates[1]._id, // Priya applying to ML job - perfect match
        status: "Offer",
        coverLetter: "ML is my passion. I've deployed 12+ production ML models and built end-to-end MLOps pipelines at scale.",
        matchScore: 97,
        aiAnalysis: {
          score: 95,
          strengths: ["PyTorch expert", "MLOps pipeline experience", "AWS Sagemaker", "Production ML systems"],
          missingSkills: [],
          summary: "Exceptional candidate. Perfect match for all skills with 4 years of directly relevant experience.",
          status: "done",
          analyzedAt: new Date(),
        },
        rating: 5,
        notes: "Top candidate. Recommended for offer.",
      },
      {
        jobId: jobs[2]._id,
        candidateId: candidates[2]._id, // Jake applying to DevOps job - perfect match
        status: "Shortlisted",
        coverLetter: "DevOps is my specialty. I manage 50+ microservices in production on Kubernetes daily.",
        matchScore: 94,
        aiAnalysis: {
          score: 91,
          strengths: ["Kubernetes expert", "Terraform proficiency", "AWS expertise", "CI/CD pipelines"],
          missingSkills: [],
          summary: "Strong DevOps candidate with deep hands-on experience across all required technologies.",
          status: "done",
          analyzedAt: new Date(),
        },
        rating: 4,
      },
      {
        jobId: jobs[3]._id,
        candidateId: candidates[3]._id, // Emma applying to Design job - perfect match
        status: "Interview",
        coverLetter: "I'm a product designer who blends user research with beautiful UI. I've built design systems for 3 companies.",
        matchScore: 89,
        aiAnalysis: {
          score: 87,
          strengths: ["Figma expert", "Strong portfolio", "Design systems experience", "User research"],
          missingSkills: ["Motion Design"],
          summary: "Excellent design candidate. Strong match with great portfolio demonstrating all core competencies.",
          status: "done",
          analyzedAt: new Date(),
        },
        rating: 4,
      },
      {
        jobId: jobs[4]._id,
        candidateId: candidates[4]._id, // David applying to Backend Node.js job - great match
        status: "Shortlisted",
        coverLetter: "Backend is where I thrive. I've built RESTful APIs serving 10M+ requests/day using Node.js and MongoDB.",
        matchScore: 88,
        aiAnalysis: {
          score: 84,
          strengths: ["Node.js expertise", "MongoDB proficiency", "REST API design", "Redis caching"],
          missingSkills: ["PostgreSQL"],
          summary: "Strong backend candidate. Excellent Node.js and MongoDB skills. Minor gap in PostgreSQL.",
          status: "done",
          analyzedAt: new Date(),
        },
        rating: 4,
      },
      {
        jobId: jobs[4]._id,
        candidateId: candidates[0]._id, // Alex also applied to Backend job
        status: "Rejected",
        coverLetter: "Applying as I have backend Node.js experience too.",
        matchScore: 70,
        aiAnalysis: {
          score: 65,
          strengths: ["Node.js knowledge", "AWS experience"],
          missingSkills: ["PostgreSQL", "Deep backend architecture"],
          summary: "Candidate is primarily frontend. Backend skills present but not at the level required.",
          status: "done",
          analyzedAt: new Date(),
        },
      },
    ]);

    // ─── Interviews ──────────────────────────────────────────────────────────
    console.log("🎙️ Seeding interviews...");
    await Interview.insertMany([
      {
        candidateId: candidates[0]._id,
        jobId: jobs[0]._id,
        applicationId: applications[0]._id,
        jobRole: "Senior React Developer",
        status: "evaluated",
        totalTurns: 8,
        messages: [
          { role: "assistant", content: "Welcome! Let's start with a warm-up. Can you walk me through your experience with React and what you enjoy most about it?" },
          { role: "user", content: "I've been working with React for 5 years. I love how React's component model makes complex UIs manageable. I've built everything from simple SPAs to complex dashboards with 50+ components." },
          { role: "assistant", content: "Great! Let's dive deeper. Can you explain the difference between useCallback and useMemo, and when you'd use each?" },
          { role: "user", content: "useCallback memoizes a function reference to prevent unnecessary re-renders of child components. useMemo memoizes a computed value. I use useCallback when passing callbacks to optimized child components, and useMemo for expensive calculations that depend on specific dependencies." },
          { role: "assistant", content: "Excellent explanation. Now, how would you handle state management in a large React app with complex data flows?" },
          { role: "user", content: "For complex state, I reach for Zustand or Redux Toolkit depending on team familiarity. I prefer Zustand for its simplicity. For server state, I use React Query or Apollo Client. The key is separating UI state from server state." },
          { role: "assistant", content: "Smart approach. Can you describe a challenging performance problem you've solved in React?" },
          { role: "user", content: "We had a data grid rendering 10,000 rows causing 3-second lag. I implemented windowing with react-virtual, memo-ized row components, and moved heavy computations to web workers. Load time dropped to 200ms." },
          { role: "assistant", content: "Impressive! How do you approach accessibility in your React applications?" },
          { role: "user", content: "Accessibility is core to my workflow. I use semantic HTML, ARIA labels, ensure keyboard navigation, test with screen readers, and aim for WCAG 2.1 AA compliance. I also set up automated a11y testing with axe-core in our CI pipeline." },
        ],
        evaluation: {
          communicationScore: 90,
          technicalScore: 88,
          overallScore: 89,
          strengths: ["Deep React expertise", "Strong performance optimization knowledge", "Accessibility awareness", "Clear communication"],
          improvements: ["Could elaborate more on TypeScript patterns", "Testing strategy could be stronger"],
          feedbackSummary: "Alex demonstrated exceptional React knowledge with strong practical experience. The windowing optimization example shows real-world problem-solving ability. Communication was clear and confident. Highly recommended for the Senior role.",
          recommendation: "Hire",
          evaluatedAt: new Date(),
        },
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      },
      {
        candidateId: candidates[1]._id,
        jobId: jobs[1]._id,
        applicationId: applications[3]._id,
        jobRole: "ML Engineer",
        status: "evaluated",
        totalTurns: 8,
        messages: [
          { role: "assistant", content: "Let's start with your ML background. What types of models have you deployed to production?" },
          { role: "user", content: "I've deployed recommendation systems using collaborative filtering, NLP models for text classification, and recently fine-tuned an LLM for customer support. All running on AWS Sagemaker with 99.9% uptime." },
          { role: "assistant", content: "Can you walk me through your MLOps workflow for a new model?" },
          { role: "user", content: "I follow a structured process: experiment tracking with MLflow, model versioning in S3, automated testing with Great Expectations, A/B testing for gradual rollout, and monitoring with CloudWatch + custom dashboards. Feature store with Feast for feature reuse." },
        ],
        evaluation: {
          communicationScore: 92,
          technicalScore: 95,
          overallScore: 94,
          strengths: ["Production ML expertise", "Strong MLOps knowledge", "LLM experience", "Excellent system design"],
          improvements: ["Could discuss model interpretability more"],
          feedbackSummary: "Priya is an outstanding ML Engineer candidate. Deep production experience and MLOps maturity is exceptional. The LLM fine-tuning experience is highly relevant. Strongly recommend for hire.",
          recommendation: "Hire",
          evaluatedAt: new Date(),
        },
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
      },
    ]);

    console.log("\n✅ SEED COMPLETE!\n");
    console.log("═══════════════════════════════════════════");
    console.log("🔐 LOGIN CREDENTIALS (password: password123)");
    console.log("═══════════════════════════════════════════");
    console.log("\n📌 RECRUITER ACCOUNTS:");
    console.log("  sarah@techcorp.io    | TechCorp Inc.");
    console.log("  marcus@innovatelabs.io | Innovate Labs");
    console.log("\n📌 CANDIDATE ACCOUNTS:");
    console.log("  alex@email.com   | Senior React Dev  (5 yrs)");
    console.log("  priya@email.com  | ML Engineer       (4 yrs)");
    console.log("  jake@email.com   | DevOps Engineer   (6 yrs)");
    console.log("  emma@email.com   | Product Designer  (3 yrs)");
    console.log("  david@email.com  | Backend Engineer  (3 yrs)");
    console.log("  lisa@email.com   | Frontend Dev      (2 yrs)");
    console.log("\n📊 SEEDED:");
    console.log(`  ${recruiters.length} Recruiters | ${candidates.length} Candidates`);
    console.log(`  ${jobs.length} Jobs | ${applications.length} Applications | 2 Interviews`);
    console.log("═══════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();