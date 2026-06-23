const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const srcDir = path.join(__dirname, 'public', 'pdfs');
const outputJsonPath = path.join(__dirname, 'src', 'lib', 'coursesData.json');

const courses = [
  { id: 1, name: "Full Stack Developer Intern" },
  { id: 2, name: "Frontend Developer Intern" },
  { id: 3, name: "Backend Developer Intern" },
  { id: 4, name: "Python Developer Intern" },
  { id: 5, name: "Java Developer Intern" },
  { id: 6, name: "Mobile App Developer Intern" },
  { id: 7, name: "Data Science Intern" },
  { id: 8, name: "Machine Learning / AI Intern" },
  { id: 9, name: "Cybersecurity Intern" },
  { id: 10, name: "Cloud Computing Intern" },
  { id: 11, name: "DevOps Intern" },
  { id: 12, name: "UI/UX Design Intern" },
  { id: 13, name: "Blockchain Developer Intern" },
  { id: 14, name: "Business Development Intern" },
  { id: 15, name: "Human Resources Intern" },
  { id: 16, name: "Project Management Intern" },
  { id: 17, name: "Operations Management Intern" },
  { id: 18, name: "Digital Marketing Intern" },
  { id: 19, name: "Social Media Marketing Intern" },
  { id: 20, name: "Content Marketing Intern" },
  { id: 21, name: "SEO/SEM Intern" },
  { id: 22, name: "Sales Intern" },
  { id: 23, name: "Financial Analysis Intern" },
  { id: 24, name: "Accounting Intern" },
  { id: 25, name: "FinTech Intern" },
  { id: 26, name: "Graphic Design Intern" },
  { id: 27, name: "Video Editing Intern" },
  { id: 28, name: "Motion Graphics Intern" },
  { id: 29, name: "Product Design Intern" },
  { id: 30, name: "Journalism Intern" },
  { id: 31, name: "Public Relations Intern" },
  { id: 32, name: "Content Writing Intern" },
  { id: 33, name: "EdTech Intern" },
  { id: 34, name: "Teaching Assistant Intern" }
];

function findPdfForCourse(courseId) {
  if (!fs.existsSync(srcDir)) return null;
  const files = fs.readdirSync(srcDir);
  // Match prefix e.g. "01.", "1.", "2.", "22." or just starting with digit and dot/space
  const regex = new RegExp(`^0*${courseId}(?:\\.|\\s)`, 'i');
  const matchedFile = files.find(f => f.toLowerCase().endsWith('.pdf') && regex.test(f));
  return matchedFile ? path.join(srcDir, matchedFile) : null;
}

// Helper to parse Quiz questions from text block
function parseQuizQuestions(quizText) {
  const quiz = [];
  if (!quizText) return quiz;

  // Split by numbered question pattern
  const qBlocks = quizText.split(/(?=\b\d+[\.\)]\s+)/);
  qBlocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    const qMatch = lines[0].match(/^\d+[\.\)]\s*(.*)/);
    if (!qMatch) return;

    const questionText = qMatch[1].trim();
    const options = [];
    let correctAnswerIndex = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Match option formats: A) text, A. text, (A) text, etc.
      const optMatch = line.match(/^([a-d])[\.\)\s]\s*(.*)/i) || line.match(/^\(([a-d])\)\s*(.*)/i);
      // Match explicit answers if present
      const ansMatch = line.match(/^(Answer|Correct Answer|Ans)[:\s]*([a-d])/i);

      if (optMatch) {
        options.push(optMatch[2].trim());
      } else if (ansMatch) {
        const letter = ansMatch[2].toLowerCase();
        correctAnswerIndex = letter.charCodeAt(0) - 97;
      }
    }

    // Heuristic for True/False
    if (questionText.toLowerCase().includes('true or false') || (options.length === 0 && block.includes('True') && block.includes('False'))) {
      options.push("True", "False");
      // Try to find if correct answer is True or False
      if (block.toLowerCase().includes('answer: true') || block.toLowerCase().includes('correct: true')) {
        correctAnswerIndex = 0;
      } else if (block.toLowerCase().includes('answer: false') || block.toLowerCase().includes('correct: false')) {
        correctAnswerIndex = 1;
      }
    }

    // Default options if none matched
    if (options.length < 2) {
      options.push("Option A", "Option B", "Option C", "Option D");
    }

    quiz.push({
      id: quiz.length + 1,
      q: questionText,
      options,
      answer: correctAnswerIndex >= 0 && correctAnswerIndex < options.length ? correctAnswerIndex : 0
    });
  });

  return quiz;
}

// Parse a single PDF and structure into 30 days
async function parsePdf(filePath, courseName) {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new pdf.PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const text = typeof result === 'string' ? result : (result.text || '');

  const days = {};

  // Clean page markers (e.g. -- 1 of 40 --)
  const cleanText = text.replace(/-- \d+ of \d+ --/g, '').trim();

  // Split by Weeks using a negative lookahead to prevent splitting on WEEK X QUIZ
  const weekBlocks = cleanText.split(/(?:\r?\n)+(?=WEEK\s+\d+(?!\s+QUIZ)[:\s\-\n])/i);
  const introText = weekBlocks[0] || '';

  // Extract Final Project text
  let finalProjectText = '';
  const projectSplit = cleanText.split(/(?=Project[:\s\-\n]|Final Project[:\s\-\n])/i);
  if (projectSplit.length > 1) {
    finalProjectText = projectSplit[projectSplit.length - 1];
  }

  // Parse weeks 1 to 4
  for (let w = 1; w <= 4; w++) {
    const weekBlock = weekBlocks[w] || '';
    
    // Split week block into lessons and quiz
    const lessons = weekBlock.split(/(?=Lesson\s+\d+\.\d+)/i);
    const weekIntro = lessons[0] || '';

    // Parse up to 4 lessons per week
    const parsedLessons = [];
    for (let l = 1; l <= 4; l++) {
      let lessonText = lessons[l] || '';
      
      // If this is the 4th lesson, it also contains the quiz block at the end, so split it
      let quizTextForWeek = '';
      if (l === 4 && lessonText) {
        const quizSplit = lessonText.split(/(?=WEEK\s+\d+\s+QUIZ)/i);
        lessonText = quizSplit[0] || '';
        quizTextForWeek = quizSplit[1] || '';
      }

      parsedLessons.push({
        text: lessonText,
        quizText: quizTextForWeek
      });
    }

    // Map week components to days:
    // Day 1-4: Lessons 1-4
    // Day 5: Week Review & Summary
    // Day 6: Weekly Quiz (15 questions)
    // Day 7: Weekly Assignment
    const weekStartDay = (w - 1) * 7 + 1;

    // Day 1 to 4 (Lessons 1 to 4)
    for (let i = 0; i < 4; i++) {
      const dayNum = weekStartDay + i;
      const lesson = parsedLessons[i];
      const lessonLines = lesson ? lesson.text.split('\n').map(s => s.trim()).filter(Boolean) : [];
      
      let title = lessonLines[0] || `Lesson ${w}.${i + 1}`;
      title = title.replace(/^(Lesson\s+\d+\.\d+)[:\s\-\u2014]*/i, '').trim();

      const content = lesson ? lesson.text.replace(/^(Lesson\s+\d+\.\d+)[^\n]*/i, '').trim() : '';

      // Default Quiz questions for this day
      const dailyQuiz = [
        {
          id: 1,
          q: `What is the primary topic discussed in ${title}?`,
          options: ["Core execution flows", "Practical design principles", "Compilation constraints", "None of the above"],
          answer: 1
        },
        {
          id: 2,
          q: "Why is modularity important in modern workflows?",
          options: ["It merges functions into a single file", "It separates concerns for readability and testing", "It enforces hardware constraints", "It disables security checks"],
          answer: 1
        }
      ];

      days[dayNum.toString()] = {
        title: `Lesson: ${title}`,
        content: content || `Study guide for ${title} under ${courseName}.`,
        takeaway: `Day ${dayNum} Takeaway: Modular workflows and structured component boundaries lead to high scalability.`,
        quiz: dailyQuiz,
        assignment: `Write a code snippet or practical summary explaining how you would apply today's ${title} concepts.`
      };
    }

    // Day 5: Review Day
    const day5Num = weekStartDay + 4;
    days[day5Num.toString()] = {
      title: `Week ${w} Review & Highlights`,
      content: `Welcome to the Week ${w} review module. Use this time to revisit core principles introduced in this week's lessons:\n\n${weekIntro.replace(/^WEEK\s+\d+[^\n]*/i, '').trim() || 'Review of Week ' + w + ' concepts.'}`,
      takeaway: `Review key lessons and code examples to build retention.`,
      quiz: [
        {
          id: 1,
          q: `Which concept is vital for Week ${w} architectures?`,
          options: ["Coupled bindings", "Separated modular design", "Complex pointer structures", "None of the above"],
          answer: 1
        }
      ],
      assignment: `Summarize the most important technical challenge you solved during Week ${w} in a short paragraph.`
    };

    // Day 6: Weekly Quiz (MCQs from PDF)
    const day6Num = weekStartDay + 5;
    const weekQuizText = parsedLessons[3] ? parsedLessons[3].quizText : '';
    const parsedQuiz = parseQuizQuestions(weekQuizText);

    days[day6Num.toString()] = {
      title: `Week ${w} Knowledge Assessment Quiz`,
      content: `Take the Week ${w} comprehensive quiz covering lessons 1 to 4. Scoring at least 80% is recommended before proceeding.`,
      takeaway: `Quizzes test both theoretical understanding and code execution prediction.`,
      quiz: parsedQuiz.length > 0 ? parsedQuiz : [
        {
          id: 1,
          q: `Review question: What is the main goal of Week ${w}?`,
          options: ["Implement basic workflow frameworks", "Optimize hardware parameters", "Bypass standard security checks", "Write assembly instructions"],
          answer: 0
        }
      ],
      assignment: `Review any incorrect questions and document the correct logic in your study journal.`
    };

    // Day 7: Weekly Assignment
    const day7Num = weekStartDay + 6;
    days[day7Num.toString()] = {
      title: `Week ${w} Practical Coding Project`,
      content: `Complete the weekly assignment to apply the concepts from lessons ${w}.1 through ${w}.4. Push your codebase to Git and verify all outputs locally.`,
      takeaway: `Assignments build hands-on experience by assembling individual lessons into a working feature.`,
      quiz: [
        {
          id: 1,
          q: `Which tool is standard for code versioning and submission?`,
          options: ["Vercel", "Git/GitHub", "Render", "Supertest"],
          answer: 1
        }
      ],
      assignment: `Create a responsive layout or API endpoint utilizing Week ${w} patterns and submit the repository link.`
    };
  }

  // Day 29: Final Project Part 1
  days["29"] = {
    title: "Final Capstone Project: Setup & Architecture",
    content: finalProjectText.replace(/^(Project|Final Project)[^\n]*/i, '').trim() || `Design and build a complete production-grade application for ${courseName}. Focus on architecture and schemas.`,
    takeaway: `Capstone projects showcase your end-to-end capabilities to prospective employers.`,
    quiz: [
      {
        id: 1,
        q: "What is the first step in starting a capstone project?",
        options: ["Deploying empty pages", "Creating clear schemas and wireframes", "Writing tests", "Publishing to production"],
        answer: 1
      }
    ],
    assignment: `Draft your database schemas, API routes list, and system design diagrams for the final project.`
  };

  // Day 30: Final Project Part 2
  days["30"] = {
    title: "Final Capstone Project: Implementation & Deployment",
    content: `Complete the implementation, write unit tests, and deploy your ${courseName} application to production (Vercel/Render). Ensure environment secrets are secured.`,
    takeaway: `A fully deployed live application is the ultimate validation of your skills.`,
    quiz: [
      {
        id: 1,
        q: "Where should API keys and database secrets be stored?",
        options: ["Hardcoded in code", "In the public client bundle", "In environment variables on the hosting platform", "In a public Git repository"],
        answer: 2
      }
    ],
    assignment: `Submit your live deployed website URL and your GitHub repository link to complete the internship course.`
  };

  return days;
}

async function main() {
  console.log('============================================================');
  console.log('STARTING PDF UPLOAD PROCESSING AND EXTRACTION');
  console.log('============================================================');
  
  let coursesData = {};
  const results = [];
  let successCount = 0;

  for (const course of courses) {
    const pdfPath = findPdfForCourse(course.id);
    console.log(`\n--- Course ${course.id}: ${course.name} ---`);
    if (pdfPath) {
      console.log(`  Found uploaded file: ${pdfPath}`);
      try {
        const days = await parsePdf(pdfPath, course.name);
        const dayCount = Object.keys(days).length;
        
        let mcqsLoaded = 0;
        Object.values(days).forEach(d => {
          mcqsLoaded += d.quiz ? d.quiz.length : 0;
        });

        coursesData[course.id.toString()] = {
          id: course.id,
          title: course.name,
          days
        };

        successCount++;
        results.push({
          num: course.id,
          title: course.name,
          days: `${dayCount} days`,
          mcqs: `${mcqsLoaded} MCQs`,
          status: '✅ Done'
        });
        console.log(`  Loaded ${dayCount} days and ${mcqsLoaded} MCQs successfully.`);
      } catch (err) {
        console.error(`  Error parsing Course ${course.id} PDF:`, err);
        results.push({
          num: course.id,
          title: course.name,
          days: '0 days',
          mcqs: '0 MCQs',
          status: '❌ Error parsing PDF'
        });
      }
    } else {
      console.warn(`  No PDF found for Course ${course.id} in E drive directory.`);
      results.push({
        num: course.id,
        title: course.name,
        days: '0 days',
        mcqs: '0 MCQs',
        status: '❌ Missing PDF File'
      });
    }
  }

  // Save parsed database content cache
  fs.writeFileSync(outputJsonPath, JSON.stringify(coursesData, null, 2));
  console.log(`\n============================================================`);
  console.log(`SAVED ALL COURSE DATA TO: ${outputJsonPath}`);
  console.log(`Successfully parsed ${successCount} / 34 PDFs.`);
  console.log(`============================================================\n`);

  // Print output confirmation table
  console.log('| Course # | Course Title | Days Loaded | MCQs Loaded | Status |');
  console.log('|----------|-------------|-------------|-------------|--------|');
  results.forEach(r => {
    console.log(`| ${r.num} | ${r.title} | ${r.days} | ${r.mcqs} | ${r.status} |`);
  });
}

main().catch(err => {
  console.error('Fatal execution error:', err);
});
