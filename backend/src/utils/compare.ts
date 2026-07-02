export class OutputMatcher {
  /**
   * Cleans and normalizes output text blocks to strip architecture line endings,
   * collapsing spaces and trailing padding to execute an exact semantic check.
   */
  static normalize(text: string): string {
    return text
      .replace(/\r\n/g, "\n")       // Force uniform Linux style line break delimiters
      .replace(/\r/g, "\n")         // Sanitize carriage returns
      .split("\n")                  // Split into individual data lines
      .map((line) => line.trimEnd()) // Remove invisible trailing whitespace from each line
      .join("\n")                   // Glue the lines back together
      .trim();                      // Slice off leading/trailing empty padding lines entirely
  }

  /**
   * Runs an assertion check comparing execution outputs against expected results
   */
  static match(actual: string, expected: string): boolean {
    return this.normalize(actual) === this.normalize(expected);
  }
}