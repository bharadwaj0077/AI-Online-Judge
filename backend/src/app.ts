import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { exec } from "child_process";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { prisma } from "./config/db";
import { Verdict, Difficulty, ProblemVisibility, UserRole } from "@prisma/client";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const DIFFICULTY_POINTS: Record<string, number> = { EASY: 100, MEDIUM: 200, HARD: 300 };

/**
 * 🔑 AUTHENTICATION
 */
app.post("/api/v1/auth/register", async (req, res): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) { res.status(400).json({ success: false, message: "Required" }); return; }
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username ? username : email.split("@")[0]).trim().toLowerCase();
    const existing = await prisma.user.findFirst({ where: { OR: [{ email: cleanEmail }, { username: cleanUsername }], deletedAt: null } });
    if (existing) { res.status(400).json({ success: false, message: "Username or Email is already registered." }); return; }
    const user = await prisma.user.create({ data: { username: cleanUsername, email: cleanEmail, passwordHash: password, role: UserRole.USER } });
    const token = `token_${user.id}_${Date.now()}`;
    res.cookie("token", token, { path: "/", maxAge: 86400000, sameSite: "lax" });
    res.status(201).json({ success: true, token, user: { id: user.id.toString(), username: user.username, role: user.role } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.post("/api/v1/auth/login", async (req, res): Promise<void> => {
  try {
    const { email, password, requiredRole } = req.body;
    const inputStr = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({ where: { OR: [{ email: inputStr }, { username: inputStr }], deletedAt: null } });
    if (!user || user.passwordHash !== password) { res.status(401).json({ success: false, message: "Invalid credentials." }); return; }
    if (requiredRole === "ADMIN" && user.role !== UserRole.ADMIN) { res.status(403).json({ success: false, message: "Access denied. Admin required." }); return; }
    const token = `token_${user.id}_${Date.now()}`;
    res.cookie("token", token, { path: "/", maxAge: 86400000, sameSite: "lax" });
    res.status(200).json({ success: true, token, user: { id: user.id.toString(), username: user.username, role: user.role } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * 🛡️ ADMIN: USER MANAGEMENT
 */
app.get("/api/v1/admin/users", async (req, res): Promise<void> => {
  try {
    const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, username: true, email: true, role: true, problemsSolved: true }, orderBy: { problemsSolved: 'desc' } });
    res.status(200).json({ success: true, data: users.map(u => ({ ...u, id: u.id.toString() })) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch("/api/v1/admin/users/:id/promote", async (req, res): Promise<void> => {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!targetUser) { res.status(404).json({ success: false, message: "User not found" }); return; }
    if (targetUser.role === UserRole.ADMIN) { res.status(400).json({ success: false, message: "Already Admin" }); return; }
    await prisma.user.update({ where: { id: BigInt(req.params.id) }, data: { role: UserRole.ADMIN } });
    res.status(200).json({ success: true, message: "Promoted to Admin" });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * 🏆 ADMIN: CONTEST MANAGEMENT
 */
app.post("/api/v1/contests", async (req, res): Promise<void> => {
  try {
    const { title, description, start_time, end_time, problemIds } = req.body;
    const contest = await prisma.contest.create({
      data: {
        title, description: description || "", startTime: new Date(start_time), endTime: new Date(end_time),
        problems: { create: (problemIds || []).map((pId: string) => ({ problem: { connect: { id: BigInt(pId) } } })) }
      }
    });
    res.status(201).json({ success: true, data: { ...contest, id: contest.id.toString() } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/v1/contests", async (req, res): Promise<void> => {
  try {
    const contests = await prisma.contest.findMany({ orderBy: { startTime: 'asc' } });
    res.status(200).json({ success: true, data: contests.map(c => ({ ...c, id: c.id.toString() })) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete("/api/v1/contests/:id", async (req, res): Promise<void> => {
  try {
    await prisma.contest.delete({ where: { id: BigInt(req.params.id) } });
    res.status(200).json({ success: true, message: "Contest deleted successfully." });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/v1/contests/:publicId", async (req, res): Promise<void> => {
  try {
    const { publicId } = req.params;
    const contest = await prisma.contest.findFirst({
      where: { publicId },
      include: { problems: { include: { problem: { include: { testCases: { where: { isSample: true }, orderBy: { orderNo: 'asc' } } } } } } }
    });

    if (!contest) { res.status(404).json({ success: false, message: "Contest not found." }); return; }

    const formattedProblems = contest.problems.map((cp) => ({
      id: cp.problem.id.toString(), title: cp.problem.title, slug: cp.problem.slug, difficulty: cp.problem.difficulty, statement: cp.problem.statement, inputFormat: cp.problem.inputFormat, outputFormat: cp.problem.outputFormat, constraintsText: cp.problem.constraintsText, timeLimitMs: cp.problem.timeLimitMs, memoryLimitMb: cp.problem.memoryLimitMb, inputTemplate: cp.problem.inputTemplate, testCases: cp.problem.testCases.map((tc) => ({ id: tc.id.toString(), input: tc.input, expectedOutput: tc.expectedOutput, isSample: tc.isSample }))
    }));

    res.status(200).json({ success: true, data: { id: contest.id.toString(), publicId: contest.publicId, title: contest.title, description: contest.description, startTime: contest.startTime, endTime: contest.endTime, problems: formattedProblems } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * 📚 PROBLEM CATALOG & CRUD
 */
app.post("/api/v1/problems", async (req, res): Promise<void> => {
  try {
    const { title, difficulty, timeLimitMs, memoryLimitMb, statement, constraintsText, testCases, referenceSolution, templates } = req.body;
    if (!title || !statement) { res.status(400).json({ success: false, message: "Title and statement are required." }); return; }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const defaultTemplates = {
      python3: "class Solution:\n    def solve(self, *args):\n        pass", cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    void solve() {\n    }\n};", java17: "import java.util.*;\nclass Solution {\n    public void solve() {\n    }\n}", javascript: "class Solution {\n    solve(...args) {\n    }\n}"
    };
    const finalTemplates = { python3: templates?.python3 || defaultTemplates.python3, cpp17: templates?.cpp17 || defaultTemplates.cpp17, java17: templates?.java17 || defaultTemplates.java17, javascript: templates?.javascript || defaultTemplates.javascript };

    const problem = await prisma.problem.create({
      data: {
        title, slug, statement, difficulty: difficulty || Difficulty.EASY, timeLimitMs: Number(timeLimitMs) || 2000, memoryLimitMb: Number(memoryLimitMb) || 256, constraintsText: constraintsText || "", inputFormat: "", outputFormat: "", visibility: ProblemVisibility.PUBLIC, inputTemplate: JSON.stringify(finalTemplates), referenceSolution: referenceSolution || "class Solution:\n    def solve(self, *args):\n        pass",
        testCases: { create: testCases?.map((tc: any, idx: number) => ({ orderNo: idx + 1, input: tc.input || "", expectedOutput: tc.expectedOutput || "", isSample: tc.isSample === false ? false : true })) || [] }
      }
    });
    res.status(201).json({ success: true, data: { ...problem, id: problem.id.toString() } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete("/api/v1/problems/:id", async (req, res): Promise<void> => {
  try {
    await prisma.problem.update({ where: { id: BigInt(req.params.id) }, data: { deletedAt: new Date(), visibility: ProblemVisibility.ARCHIVED } });
    res.status(200).json({ success: true, message: "Problem deleted successfully." });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/v1/problems", async (req, res): Promise<void> => {
  try {
    const problems = await prisma.problem.findMany({
      where: { deletedAt: null },
      // 🚀 FEATURE: Sorted by ID ascending by default as requested
      orderBy: { id: "asc" }
    });
    const formatted = problems.map((p) => ({ id: p.id.toString(), title: p.title, slug: p.slug, difficulty: p.difficulty, statement: p.statement, inputFormat: p.inputFormat, outputFormat: p.outputFormat, constraintsText: p.constraintsText, timeLimitMs: p.timeLimitMs, memoryLimitMb: p.memoryLimitMb, inputTemplate: p.inputTemplate }));
    res.status(200).json({ success: true, data: formatted });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/v1/problems/:slug", async (req, res): Promise<void> => {
  try {
    const { slug } = req.params;
    const problem = await prisma.problem.findFirst({
      where: { OR: [{ slug: slug }, { id: !isNaN(Number(slug)) ? BigInt(slug) : undefined }], deletedAt: null },
      include: { testCases: { where: { isSample: true }, orderBy: { orderNo: 'asc' } } }
    });
    if (!problem) { res.status(404).json({ success: false, message: "Problem not found." }); return; }
    res.status(200).json({
      success: true,
      data: {
        id: problem.id.toString(), title: problem.title, slug: problem.slug, statement: problem.statement, inputFormat: problem.inputFormat, outputFormat: problem.outputFormat, constraintsText: problem.constraintsText, difficulty: problem.difficulty, timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb, inputTemplate: problem.inputTemplate,
        testCases: problem.testCases.map((tc) => ({ id: tc.id.toString(), input: tc.input, expectedOutput: tc.expectedOutput, isSample: tc.isSample }))
      }
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * ⚡ DYNAMIC MULTI-LANGUAGE DOCKER SANDBOX ENGINE
 */
const runCodeInSandbox = ( code: string, language: string, inputData: string ): Promise<{ rawStdout: string; stderr: string; execTimeMs: number; timedOut: boolean }> => {
  return new Promise((resolve) => {
    const lang = (language || "python3").toLowerCase().trim(); let runnerCmd = ""; let fullSource = "";
    const cleanInput = (inputData || "").trim(); const startTime = Date.now();

    if (lang.includes("javascript") || lang.includes("js")) {
      runnerCmd = `docker run -i --rm --memory="256m" --network none node:20-slim node -`;
      fullSource = `let userStdout = ""; const originalLog = console.log; console.log = (...args) => { userStdout += args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ") + "\\n"; };\n${code}\ntry { if (typeof Solution === 'undefined') throw new Error("ReferenceError: 'Solution' class is not defined."); const sol = new Solution(); const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(sol)).filter(m => m !== 'constructor'); let res = undefined; if (methodNames.length > 0) { const rawInput = ${JSON.stringify(cleanInput)}; const lines = rawInput.split('\\n').map(l => l.trim()).filter(Boolean); let tokens = []; lines.forEach(line => { const parts = line.split(/,(?![^\\[]*\\])/); parts.forEach(p => { let trimmed = p.trim(); if (trimmed) { if (trimmed.includes('=')) trimmed = trimmed.split('=').slice(1).join('=').trim(); tokens.push(trimmed); } }); }); const args = tokens.map(val => { try { return JSON.parse(val); } catch(e) { return isNaN(val) ? val : Number(val); } }); res = sol[methodNames[0]](...args); } console.log = originalLog; console.log("===STDOUT_START===\\n" + userStdout.trim() + "\\n===STDOUT_END==="); console.log("===RESULT_START===\\n" + JSON.stringify(res) + "\\n===RESULT_END==="); } catch(e) { console.log = originalLog; console.error(e.message); }`;
    } else if (lang.includes("java")) {
      runnerCmd = `docker run -i --rm --memory="256m" --network none eclipse-temurin:17-jdk sh -c "cat > SolutionMain.java && javac SolutionMain.java && java SolutionMain"`;
      fullSource = code.includes("public static void main") ? code : `import java.util.*; import java.io.*; import java.lang.reflect.*;\n${code}\npublic class SolutionMain { public static void main(String[] args) { ByteArrayOutputStream baos = new ByteArrayOutputStream(); PrintStream ps = new PrintStream(baos); PrintStream oldOut = System.out; System.setOut(ps); String rawInput = ${JSON.stringify(cleanInput)}; Object res = null; try { Solution sol = new Solution(); Method targetMethod = null; for (Method m : Solution.class.getDeclaredMethods()) { if (Modifier.isPublic(m.getModifiers()) && !m.isSynthetic()) { targetMethod = m; break; } } if (targetMethod != null) { String[] lines = rawInput.split("\\\\n"); List<String> tokens = new ArrayList<>(); for (String l : lines) { for (String part : l.split(",(?![^\\\\[]*\\\\])")) { String trimmed = part.trim(); if (!trimmed.isEmpty()) { if (trimmed.contains("=")) tokens.add(trimmed.substring(trimmed.indexOf("=") + 1).trim()); else tokens.add(trimmed); } } } Class<?>[] paramTypes = targetMethod.getParameterTypes(); Object[] methodArgs = new Object[paramTypes.length]; for (int i = 0; i < paramTypes.length; i++) { String tok = i < tokens.size() ? tokens.get(i) : ""; Class<?> pType = paramTypes[i]; if (pType == int.class || pType == Integer.class) { String cleanNum = tok.replaceAll("[^0-9-]", ""); methodArgs[i] = cleanNum.isEmpty() ? 0 : Integer.parseInt(cleanNum); } else if (pType == double.class || pType == Double.class) { String cleanNum = tok.replaceAll("[^0-9.-]", ""); methodArgs[i] = cleanNum.isEmpty() ? 0.0 : Double.parseDouble(cleanNum); } else if (pType == boolean.class || pType == Boolean.class) { methodArgs[i] = Boolean.parseBoolean(tok.trim()); } else if (pType == String.class) { String s = tok.trim(); if (s.length() >= 2 && s.charAt(0) == '"' && s.charAt(s.length() - 1) == '"') s = s.substring(1, s.length() - 1); methodArgs[i] = s; } else if (pType == int[].class) { String cleanArr = tok.replaceAll("[^0-9,-]", ""); if (cleanArr.isEmpty()) methodArgs[i] = new int[0]; else { String[] parts = cleanArr.split(","); List<Integer> list = new ArrayList<>(); for (String pt : parts) { if (!pt.trim().isEmpty()) list.add(Integer.parseInt(pt.trim())); } int[] arr = new int[list.size()]; for (int k = 0; k < list.size(); k++) arr[k] = list.get(k); methodArgs[i] = arr; } } else methodArgs[i] = tok; } res = targetMethod.invoke(sol, methodArgs); if (res instanceof int[]) res = Arrays.toString((int[]) res); if (res instanceof boolean[]) res = Arrays.toString((boolean[]) res); if (res instanceof Object[]) res = Arrays.deepToString((Object[]) res); } } catch(Exception e) { res = "Error: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()); } System.setOut(oldOut); String userStdout = baos.toString().trim(); System.out.println("===STDOUT_START==="); System.out.println(userStdout); System.out.println("===STDOUT_END==="); System.out.println("===RESULT_START==="); System.out.println(res); System.out.println("===RESULT_END==="); } }`;
    } else if (lang.includes("cpp") || lang.includes("c++")) {
      runnerCmd = `docker run -i --rm --memory="256m" --network none gcc:11 sh -c "cat > main.cpp && g++ -O2 main.cpp -o main && ./main"`;
      const methods = [...code.matchAll(/(?:vector<[^>]+>|int|bool|string|double|void|long long)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g)];
      let methodName = "twoSum", paramTypesStr = "";
      if (methods.length > 0) { methodName = methods[0][1]; paramTypesStr = methods[0][2]; }
      const params = paramTypesStr.split(",").map(p => p.trim()).filter(Boolean);
      let argParsersCode = "", argNamesList: string[] = [];
      params.forEach((param, idx) => {
        const argName = `arg${idx}`; argNamesList.push(argName);
        if (param.includes("vector<int>") || param.includes("int[]")) argParsersCode += `    vector<int> ${argName} = parseVectorInt(tokens.size() > ${idx} ? tokens[${idx}] : "[]");\n`;
        else if (param.includes("vector<string>")) argParsersCode += `    vector<string> ${argName} = parseVectorString(tokens.size() > ${idx} ? tokens[${idx}] : "[]");\n`;
        else if (param.startsWith("int") || param.includes("long")) argParsersCode += `    int ${argName} = parseSmallInt(tokens.size() > ${idx} ? tokens[${idx}] : "0");\n`;
        else if (param.startsWith("double") || param.startsWith("float")) argParsersCode += `    double ${argName} = parseSmallDouble(tokens.size() > ${idx} ? tokens[${idx}] : "0.0");\n`;
        else if (param.startsWith("bool")) argParsersCode += `    bool ${argName} = (tokens.size() > ${idx} && (tokens[${idx}] == "true" || tokens[${idx}] == "1"));\n`;
        else if (param.includes("string")) argParsersCode += `    string ${argName} = parseCleanString(tokens.size() > ${idx} ? tokens[${idx}] : "");\n`;
        else argParsersCode += `    string ${argName} = tokens.size() > ${idx} ? tokens[${idx}] : "";\n`;
      });
      const argsInvocation = argNamesList.join(", ");
      fullSource = code.includes("int main") ? code : `#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <algorithm>\n#include <cctype>\nusing namespace std;\n${code}\nstring trimStr(string s) { while(!s.empty() && isspace(s.front())) s.erase(s.begin()); while(!s.empty() && isspace(s.back())) s.pop_back(); return s; }\nvector<string> getTokens(string input) { vector<string> tokens; stringstream ss(input); string line; while(getline(ss, line)) { line = trimStr(line); if(line.empty()) continue; size_t pos = 0; while(pos < line.size()) { size_t comma = line.find(',', pos), bracketOpen = line.find('[', pos), bracketClose = line.find(']', pos); if(comma != string::npos && bracketOpen != string::npos && comma > bracketOpen && comma < bracketClose) comma = line.find(',', bracketClose); string part; if(comma != string::npos) { part = line.substr(pos, comma - pos); pos = comma + 1; } else { part = line.substr(pos); pos = line.size(); } part = trimStr(part); if(part.find('=') != string::npos) part = trimStr(part.substr(part.find('=') + 1)); if(!part.empty()) tokens.push_back(part); } } return tokens; }\nint parseSmallInt(string s) { string clean = ""; for(char c : s) if(isdigit(c) || c == '-') clean += c; if(clean.empty()) return 0; try { return stoi(clean); } catch(...) { return 0; } }\ndouble parseSmallDouble(string s) { string clean = ""; for(char c : s) if(isdigit(c) || c == '-' || c == '.') clean += c; if(clean.empty()) return 0.0; try { return stod(clean); } catch(...) { return 0.0; } }\nstring parseCleanString(string s) { s = trimStr(s); if(s.size() >= 2 && s.front() == '"' && s.back() == '"') return s.substr(1, s.size() - 2); return s; }\nvector<int> parseVectorInt(string s) { vector<int> res; for(char &c : s) if(c == '[' || c == ']' || c == ',' || c == '=') c = ' '; stringstream ss(s); int val; while(ss >> val) res.push_back(val); return res; }\nvector<string> parseVectorString(string s) { vector<string> res; bool inQuotes = false; string cur = ""; for(char c : s) { if(c == '"') { if(inQuotes) { res.push_back(cur); cur = ""; inQuotes = false; } else inQuotes = true; } else if(inQuotes) cur += c; } return res; }\ntemplate<typename T> void printRes(T val) { cout << val; }\nvoid printRes(bool val) { cout << (val ? "true" : "false"); }\nvoid printRes(const vector<int>& vec) { cout << "["; for(size_t i = 0; i < vec.size(); i++) cout << vec[i] << (i + 1 < vec.size() ? "," : ""); cout << "]"; }\nvoid printRes(const vector<string>& vec) { cout << "["; for(size_t i = 0; i < vec.size(); i++) cout << "\\"" << vec[i] << "\\"" << (i + 1 < vec.size() ? "," : ""); cout << "]"; }\nint main() { string input_str = ${JSON.stringify(cleanInput)}; vector<string> tokens = getTokens(input_str);\n${argParsersCode}\n    stringstream user_out; streambuf* old_cout = cout.rdbuf(user_out.rdbuf()); Solution sol; auto res = sol.${methodName}(${argsInvocation}); cout.rdbuf(old_cout); cout << "===STDOUT_START===\\n" << user_out.str() << "===STDOUT_END===\\n===RESULT_START===\\n"; printRes(res); cout << "\\n===RESULT_END===\\n"; return 0; }`;
    } else {
      runnerCmd = `docker run -i --rm --memory="256m" --network none python:3.11-slim python3 -`;
      fullSource = `import sys, json, io, re, signal\ndef timeout_handler(signum, frame): raise TimeoutError("Time Limit Exceeded (2000ms)")\nsignal.signal(signal.SIGALRM, timeout_handler)\nsignal.alarm(2)\n${code}\nif __name__ == "__main__":\n    try:\n        user_stdout = io.StringIO(); old_stdout = sys.stdout; sys.stdout = user_stdout\n        if 'Solution' not in globals(): sys.exit(1)\n        sol = Solution()\n        methods = [m for m in dir(sol) if not m.startswith("__") and callable(getattr(sol, m))]\n        if methods:\n            target_method = getattr(sol, methods[0])\n            raw_input = """${cleanInput.replace(/\\/g, "\\\\").replace(/"""/g, '\"\"\"')}"""\n            lines = [l.strip() for l in raw_input.split('\\n') if l.strip()]\n            tokens = []\n            for line in lines:\n                parts = re.split(r',(?![^\\[]*\\])', line)\n                for p in parts:\n                    pt = p.strip()\n                    if pt: tokens.append(pt.split('=', 1)[1].strip() if '=' in pt else pt)\n            parsed_args = []\n            for t in tokens:\n                try: parsed_args.append(json.loads(t))\n                except:\n                    try: parsed_args.append(int(t))\n                    except: parsed_args.append(t)\n            res = target_method(*parsed_args)\n            if isinstance(res, float) and res.is_integer(): res = int(res)\n            if isinstance(res, (list, dict)): formatted_res = json.dumps(res)\n            elif isinstance(res, bool): formatted_res = "true" if res else "false"\n            else: formatted_res = str(res)\n        sys.stdout = old_stdout\n        print("===STDOUT_START==="); print(user_stdout.getvalue(), end=""); print("===STDOUT_END===")\n        print("===RESULT_START==="); print(formatted_res); print("===RESULT_END===")\n    except TimeoutError as te: sys.stdout = sys.__stdout__; sys.stderr.write(str(te))\n    except Exception as e: sys.stdout = sys.__stdout__; sys.stderr.write(f"{type(e).__name__}: {str(e)}")`;
    }

    const child = exec(runnerCmd, { timeout: 12000, maxBuffer: 1024 * 1024 * 2 }, (err, stdout, stderr) => {
      const execTimeMs = Date.now() - startTime;
      if (err) {
        if (err.killed || err.signal === "SIGTERM" || err.code === "ETIMEDOUT") resolve({ rawStdout: stdout ? stdout.slice(0, 1000).trim() : "", stderr: "Time Limit Exceeded (TLE).", execTimeMs: 2000, timedOut: true });
        else resolve({ rawStdout: stdout ? stdout.trim() : "", stderr: stderr || err.message, execTimeMs, timedOut: false });
      } else {
        resolve({ rawStdout: stdout ? stdout.trim() : "", stderr: stderr ? stderr.trim() : "", execTimeMs, timedOut: stderr.includes("Time Limit Exceeded") });
      }
    });
    if (child.stdin) { child.stdin.write(fullSource); child.stdin.end(); }
  });
};

function parseSandboxOutput(rawStdout: string): { stdout: string; output: string } {
  let stdout = "", output = "";
  const stdoutMatch = rawStdout.match(/===STDOUT_START===([\s\S]*?)===STDOUT_END===/);
  if (stdoutMatch) stdout = stdoutMatch[1].trim();
  const resultMatch = rawStdout.match(/===RESULT_START===([\s\S]*?)===RESULT_END===/);
  if (resultMatch) output = resultMatch[1].trim(); else output = rawStdout.trim();
  return { stdout, output };
}

/**
 * 🎯 RUN & SUBMIT
 */
app.post(["/api/v1/judge/run", "/api/v1/problems/:id/run"], async (req, res): Promise<void> => {
  try {
    const { sourceCode, code, language, customInput, problemId } = req.body;
    const codeToRun = sourceCode || code;
    if (!codeToRun) { res.status(400).json({ success: false, message: "Source code is required." }); return; }

    const inputStr = (customInput || "").trim();
    let expectedOutput = "";
    const targetProblem = problemId ? await prisma.problem.findFirst({ where: { OR: [{ id: !isNaN(Number(problemId)) ? BigInt(problemId) : undefined }] }, include: { testCases: true } }) : null;

    if (targetProblem && targetProblem.testCases.length > 0) {
      const matchedTc = targetProblem.testCases.find((tc) => tc.input.trim() === inputStr);
      if (matchedTc) expectedOutput = matchedTc.expectedOutput.trim();
    }
    if (!expectedOutput && targetProblem?.referenceSolution) {
      const refExecResult = await runCodeInSandbox(targetProblem.referenceSolution, "python3", inputStr);
      const refParsed = parseSandboxOutput(refExecResult.rawStdout);
      if (refParsed.output && !refExecResult.stderr) expectedOutput = refParsed.output;
    }

    const userExecResult = await runCodeInSandbox(codeToRun, language || "python3", inputStr);
    if (userExecResult.timedOut) { res.status(200).json({ success: true, stdout: "", output: "Time Limit Exceeded", expected: expectedOutput || "Run to verify", error: "Time Limit Exceeded" }); return; }
    
    const parsed = parseSandboxOutput(userExecResult.rawStdout);
    res.status(200).json({ success: true, stdout: parsed.stdout ? parsed.stdout.slice(0, 1000) : "", output: parsed.output || "None", expected: expectedOutput || parsed.output, error: userExecResult.stderr || null });
  } catch (err: any) { res.status(200).json({ success: false, stdout: "", output: "", expected: "Run to verify", error: err.message || "Execution error." }); }
});

app.post("/api/v1/judge/submit", async (req, res): Promise<void> => {
  try {
    const { sourceCode, language, problemId } = req.body;
    let userIdStr = "";
    if (req.cookies?.token) { const parts = req.cookies.token.split("_"); if (parts.length >= 2) userIdStr = parts[1]; }

    const user = await prisma.user.findFirst({ where: userIdStr ? { id: BigInt(userIdStr) } : { deletedAt: null } });
    if (!user) { res.status(401).json({ success: false, message: "User session required." }); return; }

    const targetProblem = await prisma.problem.findFirst({ where: { OR: [{ id: !isNaN(Number(problemId)) ? BigInt(problemId) : undefined }] }, include: { testCases: true } });
    if (!targetProblem) { res.status(404).json({ success: false, message: "Problem not found." }); return; }

    const langRecord = await prisma.language.findFirst({ where: { slug: (language || "python3").toLowerCase() } });
    const languageId = langRecord ? langRecord.id : BigInt(1);
    const testCases = targetProblem.testCases.length > 0 ? targetProblem.testCases : [{ id: BigInt(1), problemId: targetProblem.id, orderNo: 1, input: "nums = [2,7,11,15]\ntarget = 9", expectedOutput: "[0,1]", isSample: true, weight: 1, createdAt: new Date(), inputStorageKey: null, outputStorageKey: null }];

    let overallVerdict: Verdict = Verdict.ACCEPTED, totalTimeMs = 0;
    
    let passedCount = 0;

    for (const tc of testCases) {
      const execResult = await runCodeInSandbox(sourceCode, language, tc.input);
      totalTimeMs += execResult.execTimeMs;
      
      if (execResult.timedOut) { 
          if(overallVerdict === Verdict.ACCEPTED) overallVerdict = Verdict.TIME_LIMIT_EXCEEDED; 
          continue; 
      }
      if (execResult.stderr) { 
          if(overallVerdict === Verdict.ACCEPTED) overallVerdict = execResult.stderr.toLowerCase().includes("syntax") ? Verdict.COMPILATION_ERROR : Verdict.RUNTIME_ERROR; 
          continue; 
      }
      
      const parsed = parseSandboxOutput(execResult.rawStdout);
      const actualClean = parsed.output.replace(/\s+/g, "").toLowerCase();
      const expectedClean = tc.expectedOutput.replace(/\s+/g, "").toLowerCase();
      
      if (actualClean === expectedClean) { 
          passedCount++; 
      } else { 
          if(overallVerdict === Verdict.ACCEPTED) overallVerdict = Verdict.WRONG_ANSWER; 
      }
    }

    const finalScore = overallVerdict === Verdict.ACCEPTED ? (DIFFICULTY_POINTS[targetProblem.difficulty] || 100) : 0;
    const submissionRecord = await prisma.submission.create({ data: { userId: user.id, problemId: targetProblem.id, languageId: languageId, sourceCode: sourceCode, verdict: overallVerdict, score: finalScore, executionTimeMs: Math.round(totalTimeMs / testCases.length), memoryUsedKb: 15420 } });
    await prisma.problem.update({ where: { id: targetProblem.id }, data: { submissionCount: { increment: 1 }, acceptedCount: overallVerdict === Verdict.ACCEPTED ? { increment: 1 } : undefined } });
    
    const isFirstTimeAccepted = overallVerdict === Verdict.ACCEPTED ? await prisma.submission.count({ where: { userId: user.id, problemId: targetProblem.id, verdict: Verdict.ACCEPTED } }) === 1 : false;
    await prisma.user.update({ where: { id: user.id }, data: { submissionsCount: { increment: 1 }, problemsSolved: isFirstTimeAccepted ? { increment: 1 } : undefined } });

    res.status(200).json({ 
        success: true, 
        submissionId: submissionRecord.id.toString(), 
        verdict: overallVerdict, 
        score: finalScore, 
        passedCases: passedCount, 
        totalCases: testCases.length, 
        executionTimeMs: submissionRecord.executionTimeMs 
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/v1/leaderboard", async (req, res): Promise<void> => {
  try {
    const allUsers = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, username: true, email: true, createdAt: true } });
    const acceptedSubmissions = await prisma.submission.findMany({ where: { verdict: Verdict.ACCEPTED }, include: { problem: { select: { id: true, difficulty: true } } } });
    const userStatsMap: Record<string, { solvedSet: Set<string>; ratingPoints: number }> = {};
    allUsers.forEach((u) => { userStatsMap[u.id.toString()] = { solvedSet: new Set(), ratingPoints: 0 }; });
    acceptedSubmissions.forEach((sub) => {
      const uId = sub.userId.toString(), pId = sub.problemId.toString();
      if (userStatsMap[uId] && !userStatsMap[uId].solvedSet.has(pId)) {
        userStatsMap[uId].solvedSet.add(pId);
        userStatsMap[uId].ratingPoints += DIFFICULTY_POINTS[sub.problem?.difficulty || Difficulty.EASY] || 100;
      }
    });
    const sortedUsers = allUsers.map((u) => {
      const stats = userStatsMap[u.id.toString()] || { solvedSet: new Set(), ratingPoints: 0 };
      return { id: u.id.toString(), name: u.username, email: u.email, solved: stats.solvedSet.size, rating: stats.ratingPoints, createdAt: u.createdAt };
    }).sort((a, b) => b.rating - a.rating || b.solved - a.solved);
    res.status(200).json({ success: true, data: sortedUsers.map((item, index) => ({ ...item, rank: index + 1 })) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/v1/dashboard", async (req, res): Promise<void> => {
  try {
    let userIdStr = req.query.userId as string;
    if (!userIdStr && req.cookies?.token) { const parts = req.cookies.token.split("_"); if (parts.length >= 2) userIdStr = parts[1]; }
    if (!userIdStr) {
      const firstUser = await prisma.user.findFirst({ where: { deletedAt: null } });
      if (!firstUser) { res.status(200).json({ success: true, data: { problemsSolved: 0, totalProblems: 0, accuracyRate: "0.0%", globalRating: 0, globalRank: "-", recentActivity: [] } }); return; }
      userIdStr = firstUser.id.toString();
    }
    const userId = BigInt(userIdStr);
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord) { res.status(404).json({ success: false, message: "User record missing." }); return; }

    const totalProblems = await prisma.problem.count({ where: { deletedAt: null } });
    const userSubmissions = await prisma.submission.findMany({ where: { userId: userId }, include: { problem: true, language: true }, orderBy: { submittedAt: "desc" } });
    const totalSubmissions = userSubmissions.length;
    const acceptedSubmissions = userSubmissions.filter((s) => s.verdict === Verdict.ACCEPTED);

    const uniqueSolvedMap = new Map<string, number>();
    acceptedSubmissions.forEach((sub) => {
      const pId = sub.problemId.toString();
      if (!uniqueSolvedMap.has(pId)) uniqueSolvedMap.set(pId, DIFFICULTY_POINTS[sub.problem.difficulty] || 100);
    });

    const problemsSolved = uniqueSolvedMap.size;
    let globalRating = 0; uniqueSolvedMap.forEach((pts) => { globalRating += pts; });
    const accuracyRate = totalSubmissions > 0 ? `${((acceptedSubmissions.length / totalSubmissions) * 100).toFixed(1)}%` : "0.0%";

    const allUsers = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true } });
    const allAcceptedSubs = await prisma.submission.findMany({ where: { verdict: Verdict.ACCEPTED }, include: { problem: { select: { difficulty: true } } } });
    const scoresMap: Record<string, number> = {}; const solvedSets: Record<string, Set<string>> = {};
    allUsers.forEach((u) => { scoresMap[u.id.toString()] = 0; solvedSets[u.id.toString()] = new Set(); });

    allAcceptedSubs.forEach((sub) => {
      const uIdStr = sub.userId.toString(), pIdStr = sub.problemId.toString();
      if (solvedSets[uIdStr] && !solvedSets[uIdStr].has(pIdStr)) {
        solvedSets[uIdStr].add(pIdStr);
        scoresMap[uIdStr] += DIFFICULTY_POINTS[sub.problem.difficulty] || 100;
      }
    });

    const sortedRanks = allUsers.map((u) => ({ id: u.id.toString(), score: scoresMap[u.id.toString()] || 0, solved: solvedSets[u.id.toString()] ? solvedSets[u.id.toString()].size : 0 })).sort((a, b) => b.score - a.score || b.solved - a.solved);
    const userRankIdx = sortedRanks.findIndex((u) => u.id === userIdStr);
    const globalRank = userRankIdx !== -1 ? `#${userRankIdx + 1}` : "-";

    const recentActivity = userSubmissions.slice(0, 10).map((s) => ({ id: s.id.toString(), problem: s.problem.title, status: s.verdict, lang: s.language?.displayName || s.language?.name || "Python 3.11", submittedAt: new Date(s.submittedAt).toLocaleString() }));
    res.status(200).json({ success: true, data: { problemsSolved, totalProblems, accuracyRate, globalRating, globalRank, recentActivity } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.use(errorHandler);
export default app;