import { prisma, disconnectDB } from "../src/config/db";

async function main() {
  console.log("Seeding languages to AWS RDS...");
  
  const langs = [
    { name: "Python", displayName: "Python 3.11", slug: "python3", languageBase: "python", version: "3.11", fileExtension: "py", dockerImage: "python:3.11-slim", runCommand: "python3", isCompiled: false, executionOrder: 1 },
    { name: "C++", displayName: "C++ 17 (GCC)", slug: "cpp17", languageBase: "cpp", version: "17", fileExtension: "cpp", dockerImage: "gcc:11", compileCommand: "g++ -O2 main.cpp -o main", runCommand: "./main", isCompiled: true, executionOrder: 2 },
    { name: "Java", displayName: "Java 17 (OpenJDK)", slug: "java17", languageBase: "java", version: "17", fileExtension: "java", dockerImage: "eclipse-temurin:17-jdk", compileCommand: "javac SolutionMain.java", runCommand: "java SolutionMain", isCompiled: true, executionOrder: 3 },
    { name: "JavaScript", displayName: "JavaScript (Node20)", slug: "javascript", languageBase: "javascript", version: "20", fileExtension: "js", dockerImage: "node:20-slim", runCommand: "node", isCompiled: false, executionOrder: 4 }
  ];

  for (const lang of langs) {
    await prisma.language.upsert({
      where: { slug: lang.slug },
      update: {},
      create: lang,
    });
  }

  console.log("✅ Languages successfully added to AWS RDS!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });