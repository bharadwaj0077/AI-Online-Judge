import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_defense_document(output_paths):
    doc = docx.Document()

    # Set Margins
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Styles
    COLOR_PRIMARY = RGBColor(15, 23, 42)    # Slate 900
    COLOR_SECONDARY = RGBColor(37, 99, 235) # Blue 600
    COLOR_MUTED = RGBColor(100, 116, 139)   # Slate 500
    COLOR_DARK = RGBColor(30, 41, 59)       # Slate 800

    # 1. Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_after = Pt(2)
    p_title.paragraph_format.space_before = Pt(0)
    run_title = p_title.add_run("SYNAPSEJUDGE: NOVELTY & ARCHITECTURAL DEFENSE")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    # Subtitle / Metadata
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Formal Technical Defense Dossier  |  Intelligent Pedagogical Code Assessment Platform\nTarget Audience: Academic Evaluation Panel & Senior Review Board")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(10)
    run_sub.font.color.rgb = COLOR_MUTED

    # 2. Executive Rebuttal Callout Box
    table_callout = doc.add_table(rows=1, cols=1)
    table_callout.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_callout.autofit = False
    cell_callout = table_callout.cell(0, 0)
    cell_callout.width = Inches(7.0)
    set_cell_background(cell_callout, "F1F5F9")
    set_cell_margins(cell_callout, top=140, bottom=140, left=180, right=180)

    p_callout = cell_callout.paragraphs[0]
    p_callout.paragraph_format.space_after = Pt(4)
    r_callout_h = p_callout.add_run("1. EXECUTIVE REBUTTAL: CATEGORY ERROR IN THE PANEL'S OBJECTION\n")
    r_callout_h.font.bold = True
    r_callout_h.font.size = Pt(11)
    r_callout_h.font.color.rgb = COLOR_SECONDARY

    r_callout_body = p_callout.add_run(
        "The panel's critique that 'all these features are already available' is based on an architectural category error: "
        "equating a legacy 1st-Generation Binary Code Grader (e.g., LeetCode, HackerRank) with an Autonomous Intelligent Tutoring "
        "& Cognitive Assessment System (ITAS).\n\n"
        "Legacy platforms evaluate only the final artifact through black-box string equality (stdin -> stdout). They provide "
        "zero real-time visibility into developer cognition, zero execution state tracing, no conversational technical reasoning, "
        "and no pedagogical guidance. SynapseJudge was engineered from first principles to bridge these exact research and industrial voids."
    )
    r_callout_body.font.size = Pt(9.5)
    r_callout_body.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Direct Competitive Matrix
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r_h2 = h2.add_run("2. COMPETITIVE DIFFERENTIATION MATRIX (BENCHMARK VS. STATE-OF-THE-ART)")
    r_h2.font.bold = True
    r_h2.font.size = Pt(12)
    r_h2.font.color.rgb = COLOR_PRIMARY

    matrix_data = [
        ("Feature Dimension", "LeetCode / HackerRank", "VisuAlgo / PythonTutor", "Pramp / Peer Platforms", "Generic AI (ChatGPT)", "SynapseJudge (Our Novel System)"),
        (
            "Code Execution Visualization",
            "None\n(Pure text diff)",
            "Static Only\n(Pre-rendered textbook code. Cannot trace user code.)",
            "None",
            "None\n(Textual Markdown only)",
            "Dynamic Arbitrary Code Profiler: Interactive step-by-step memory/pointer frames for ANY user submission."
        ),
        (
            "Technical Interview Engine",
            "None",
            "None",
            "Human-only scheduling ($100-$250/hr). Dependent on peer skill.",
            "Text prompt only. No audio personas, no editor sync, hallucinations.",
            "Autonomous Speech-to-Speech Engine: 4 acoustic personas, push-to-speak VAD, live volume HUD, 100-pt rubric."
        ),
        (
            "Domain-Specific CS Synthesis",
            "None\n(Static fixed DSA questions only)",
            "None",
            "None",
            "Static Q&A without verified unit test execution.",
            "Dynamic CS Scenario Engine: Generates novel Networks, OS, & DBMS tasks with verified matching test suites."
        ),
        (
            "Competitive 1v1 Mode",
            "Binary Speed Clock\n(Rewards brute-force if submitted 1s faster)",
            "None",
            "None",
            "None",
            "AI Grandmaster Referee & Replay: Multi-criteria arbitration (optimality, modularity) + deterministic timeline replay."
        ),
        (
            "Pedagogical Mentorship",
            "Binary answer reveal\n(Destroys cognitive retention)",
            "None",
            "Variable",
            "Dumps full code immediately\n(Illusion of competence)",
            "Tiered Socratic Scaffolding: 3-tier progressive hints (Concept -> Blueprint -> Traps) without leaking code."
        ),
        (
            "Sandbox Security",
            "Proprietary / Closed",
            "Browser eval / Host",
            "Browser JS only",
            "None",
            "Zero-Trust Micro-Sandboxes: Air-gapped Docker (--network none, 256MB RAM, 0.5 CPU, 64 PIDs, OS-level kill)."
        )
    ]

    table = doc.add_table(rows=len(matrix_data), cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.5)]

    for row_idx, row in enumerate(matrix_data):
        for col_idx, text in enumerate(row):
            cell = table.cell(row_idx, col_idx)
            cell.width = col_widths[col_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            
            r = p.add_run(text)
            r.font.name = "Calibri"
            
            if row_idx == 0:
                set_cell_background(cell, "1E293B")
                r.font.bold = True
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(255, 255, 255)
            else:
                r.font.size = Pt(7.5)
                if col_idx == 5:
                    set_cell_background(cell, "EFF6FF")
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(30, 64, 175)
                elif row_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")
                    r.font.color.rgb = COLOR_DARK
                else:
                    set_cell_background(cell, "FFFFFF")
                    r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 4. Five Unprecedented Novelties
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(8)
    h3.paragraph_format.space_after = Pt(4)
    r_h3 = h3.add_run("3. DETAILED TECHNICAL NOVELTIES & ARCHITECTURAL CONTRIBUTIONS")
    r_h3.font.bold = True
    r_h3.font.size = Pt(12)
    r_h3.font.color.rgb = COLOR_PRIMARY

    novelties = [
        (
            "Novelty 1: Dynamic Arbitrary-Code Visual Execution Profiler (Algorithmic Glass-Box)",
            "Industry Gap: Existing judges are black boxes showing only raw string diffs (Expected [0,1], Got [1,2]). Existing visualizers (VisuAlgo) only animate their own pre-written algorithms.\n"
            "Our Innovation: SynapseJudge builds a compiler that decomposes arbitrary student code into discrete execution step frames (ExecutionStep). It spotlights active multi-dimensional pointers (left/right, slow/fast, matrix cells) and provides a bidirectional time-travel scrubbing HUD (Play, Pause, Step Forward/Back, 0.25x-4x speed) linked synchronously to source line execution."
        ),
        (
            "Novelty 2: Autonomous Speech-to-Speech Technical Interviewer with Dynamic CS Test Synthesis",
            "Industry Gap: Technical interviews evaluate communication, trade-off analysis, and formulation under pressure. Platforms only test silent typing against static DSA databases.\n"
            "Our Innovation: Integrated conversational loop with 4 acoustic voice personas (Alex, Sarah, David, Elena) with custom pitch and boldness modulation. When testing Computer Networks, OS, or DBMS, the system dynamically synthesizes un-googlable scenario tasks AND verified matching test cases on the fly, evaluated via an objective 100-point 5-pillar rubric."
        ),
        (
            "Novelty 3: Real-Time 1v1 Arena with Deterministic Replay & AI Grandmaster Referee",
            "Industry Gap: Competitive programming judges solely on submission timestamps, rewarding unscalable O(N^2) brute-force if submitted 1 second faster than clean O(N) code.\n"
            "Our Innovation: Introduces an AI Grandmaster Referee that qualitatively evaluates asymptotic optimality, code modularity, and algorithmic paradigm elegance. All keystrokes and visualizer states are timestamped in ArenaMatchRecord, allowing candidates and spectators to scrub through matches like an esports replay."
        ),
        (
            "Novelty 4: Socratic Pedagogical Scaffolding Engine (Anti-Plagiarism Mentorship)",
            "Industry Gap: Revealing full solutions or using ChatGPT destroys cognitive retention through the 'Illusion of Competence' (students think they understand but fail in interviews).\n"
            "Our Innovation: Implements Vygotsky's Zone of Proximal Development via a 3-Tiered Scaffolding Model: Tier 1 Cognitive Nudge (pattern intuition without code), Tier 2 Structural Blueprint (data structure invariants), and Tier 3 Edge-Case Alerts, preventing code plagiarism while cultivating problem-solving independence."
        ),
        (
            "Novelty 5: Enterprise Zero-Trust Micro-Container Sandboxing",
            "Industry Gap: Academic prototypes execute code on the host using unshielded child_process.exec() or browser eval, vulnerable to fork-bombs and filesystem escapes.\n"
            "Our Innovation: Air-gapped micro-sandboxes built on Docker with --network none, 256MB RAM ceilings, 0.5 CPU quotas, 64 PIDs limits, and blocking kernel termination (docker kill) upon timeout for Python 3.11, C++ 17, Java 17, and Node 20."
        )
    ]

    for title, desc in novelties:
        p_nov = doc.add_paragraph()
        p_nov.paragraph_format.space_before = Pt(4)
        p_nov.paragraph_format.space_after = Pt(2)
        r_nov_t = p_nov.add_run(f"• {title}\n")
        r_nov_t.font.bold = True
        r_nov_t.font.size = Pt(9.5)
        r_nov_t.font.color.rgb = COLOR_SECONDARY

        r_nov_d = p_nov.add_run(desc)
        r_nov_d.font.size = Pt(8.5)
        r_nov_d.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 5. Academic Grounding
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(6)
    h4.paragraph_format.space_after = Pt(3)
    r_h4 = h4.add_run("4. ACADEMIC & THEORETICAL GROUNDING (LITERATURE CITATIONS)")
    r_h4.font.bold = True
    r_h4.font.size = Pt(11)
    r_h4.font.color.rgb = COLOR_PRIMARY

    citations = [
        "Sweller, J. (1988). Cognitive Load Theory: SynapseJudge's visual execution profiler offloads working memory to visual perception.",
        "VanLehn, K. (2011). Intelligent Tutoring Systems: Proves progressive conceptual prompting yields +0.76 SD higher retention vs direct code reveal.",
        "Sorva, J. et al. (2013). Program Visualization: Demonstrates step-by-step visual tracking of student-authored code significantly reduces algorithmic misconceptions."
    ]

    for cite in citations:
        p_c = doc.add_paragraph()
        p_c.paragraph_format.space_before = Pt(1)
        p_c.paragraph_format.space_after = Pt(1)
        r_c = p_c.add_run(f"[{citations.index(cite)+1}] {cite}")
        r_c.font.size = Pt(8.5)
        r_c.font.color.rgb = COLOR_MUTED

    # 6. Conclusion Box
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    table_concl = doc.add_table(rows=1, cols=1)
    table_concl.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_concl.autofit = False
    cell_concl = table_concl.cell(0, 0)
    cell_concl.width = Inches(7.0)
    set_cell_background(cell_concl, "0F172A")
    set_cell_margins(cell_concl, top=120, bottom=120, left=160, right=160)

    p_concl = cell_concl.paragraphs[0]
    p_concl.paragraph_format.space_after = Pt(2)
    r_concl_h = p_concl.add_run("5. VERDICT FOR THE EVALUATION COMMITTEE\n")
    r_concl_h.font.bold = True
    r_concl_h.font.size = Pt(10.5)
    r_concl_h.font.color.rgb = RGBColor(96, 165, 250)

    r_concl_body = p_concl.add_run(
        '"SynapseJudge does not duplicate existing platforms—it introduces the next architectural paradigm. '
        'Where legacy tools offer static binary grading, SynapseJudge delivers dynamic arbitrary visual profiling. '
        'Where legacy platforms offer no interview training, SynapseJudge provides an autonomous speech-to-speech '
        'AI interviewer with dynamic CS domain synthesis. Where competitive platforms reward brute-force speed, '
        'SynapseJudge implements qualitative AI refereeing and deterministic replays."'
    )
    r_concl_body.font.italic = True
    r_concl_body.font.size = Pt(9.5)
    r_concl_body.font.color.rgb = RGBColor(241, 245, 249)

    # Save to all target paths
    for p in output_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        doc.save(p)
        print(f"[OK] Saved DOCX to: {p}")

if __name__ == "__main__":
    targets = [
        r"d:\Project_Defense_Justification\Project_Novelty_Defense.docx",
        r"d:\MainProjects\AI_Online_Judge\docs\Project_Novelty_Defense.docx"
    ]
    create_defense_document(targets)
