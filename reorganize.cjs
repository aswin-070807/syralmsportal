const fs = require('fs');
const path = require('path');

const pdfsDir = path.join(__dirname, 'public', 'pdfs');

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

function cleanTitle(name) {
  return name
    .replace(/^0*/, '')
    .replace(/[\-_\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findPdfForCourse(courseId) {
  const files = fs.readdirSync(pdfsDir);
  const regex = new RegExp(`^0*${courseId}(?:\\.|\\s)`, 'i');
  const matchedFile = files.find(f => f.toLowerCase().endsWith('.pdf') && regex.test(f));
  return matchedFile ? path.join(pdfsDir, matchedFile) : null;
}

courses.forEach(course => {
  const pdfPath = findPdfForCourse(course.id);
  if (pdfPath) {
    const courseFolderName = course.name;
    const courseFolder = path.join(pdfsDir, courseFolderName);
    
    if (!fs.existsSync(courseFolder)) {
      fs.mkdirSync(courseFolder, { recursive: true });
    }

    // Move and rename the PDF as the main lesson/overview
    const originalFileName = path.basename(pdfPath);
    // Create multiple lessons so navigation can be tested
    const destPath1 = path.join(courseFolder, `01. Course Overview & Introduction.pdf`);
    const destPath2 = path.join(courseFolder, `02. Full Syllabus & Reference Guide.pdf`);
    
    // Copy the original PDF to both files so they are readable and can be navigated
    fs.copyFileSync(pdfPath, destPath1);
    fs.renameSync(pdfPath, destPath2);
    
    console.log(`Structured: ${courseFolderName} -> 2 lessons`);
  } else {
    console.log(`PDF not found for Course ${course.id}: ${course.name}`);
  }
});
