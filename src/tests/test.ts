import child_process, { ExecException } from "child_process";
import path from "path";
import { Buffer } from "buffer";

import Tester, { RuntimeTester } from "../index";

type MatchTest<T> = (value: T) => boolean;
type MatchSideEffect<T, R> = (value: T) => R;
type Matcher<T, R> = [MatchTest<T>, MatchSideEffect<T, R>];
type Matchers<T, R> = Matcher<T, R>[];

function match<T, R>(value: T, matchers: Matchers<T, R>): R | null {
    for (let i = 0; i < matchers.length; i++) {
        const matcher = matchers[i];
        
        const test: (value: T) => boolean = matcher[0];
        const sideEffect: (value: T) => R = matcher[1];

        if (test(value) === true) {
            return sideEffect(value);
        }
    }

    return null;
}

function indent(usedToIndent: string, lines: string): string {
    return lines.split("\n").map((l) => {
        return usedToIndent + l;
    }).join("\n");
}

/**
 * Result of an command execution.
 */
interface ExecResult {
    /**
     * Process's standard output.
     */
    stdout: string;

    /**
     * Process's standard error output.
     */
    stderr: string;

    /**
     * Execution error. Null means everything went fine.
     */
    error: ExecException | null;
}

/**
 * Executes a command.
 * @param cmd To execute in a shell.
 * @returns Promise with execution results. 
 */
async function execAsync(cmd: string): Promise<ExecResult> {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, {}, (err: ExecException | null, stdout: string | Buffer, stderr: string | Buffer): void => {
            if (err === null) {
                resolve({
                    error: err,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                });
            } else {
                reject({
                    error: err,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                });
            }
        });
    });
}

// Test
/**
 * Simple definition of a test for this testing library.
 */
interface TestFile {
    /**
     * Name of file without path or file extension details.
     */
    file: string;

    /**
     * Indicates if the process is expected to run successfully.
     */
    expectedSucceeds: boolean;
}



const TEST_FILES: TestFile[] = [
    { file: "test_good", expectedSucceeds: true },
    { file: "test_bad_eq", expectedSucceeds: false },
    { file: "test_bad_gt", expectedSucceeds: false },
    { file: "test_bad_lt", expectedSucceeds: false },
    { file: "test_bad_ne", expectedSucceeds: false },
    { file: "test_bad_gte", expectedSucceeds: false },
    { file: "test_bad_lte", expectedSucceeds: false },
];
(async function() {
    let results: boolean[] = [];

    for (let i = 0; i < TEST_FILES.length; i++) {
        const testFile = TEST_FILES[i];
        
        // Run test file
        const expectedWordMatchers: Matchers<boolean, string> = [
            [(v: boolean): boolean => v === true, (v: boolean): string => "succeed"],
            [(v: boolean): boolean => v === false, (v: boolean): string => "fail"],
        ];
        
        const expectedWord = match(testFile.expectedSucceeds, expectedWordMatchers);
        const notExpectedWord = match(!testFile.expectedSucceeds, expectedWordMatchers);
        
        console.log(`TEST ${testFile.file} should ${expectedWord}`);
        
        let result: ExecResult | null = null;
        try {
            const testFilePath = path.join(__dirname, `${testFile.file}.js`);
            result = await execAsync(`node ${testFilePath}`);
        } catch (e) {
            result = e;
        }

        // Evaluate if the test file succeeded
        // Cast needed bc result is not not null in both try catch branches..
        const actualResult = result as ExecResult;
        console.log("    => stdout");
        if (actualResult.stdout.length > 0) {
            console.log(indent("    |  ", actualResult.stdout));
        }

        console.log("    => stderr");
        if (actualResult.stderr.length > 0) {
            console.log(indent("    | ", actualResult.stderr));
        }
        
        if (actualResult.error !== null) {
            if (testFile.expectedSucceeds === true) {
                console.error(`    => FAILED (Expected to ${expectedWord}, had an execution exception: ${actualResult.error}`);
                results.push(false);
                continue;
            } else {
                console.log(`    => PASSED (Expected to ${expectedWord}, did have an execution exception: ${actualResult.error}`);
                results.push(true);
                continue;
            }
        }

        if (testFile.expectedSucceeds === true) {
            console.log(`    => PASSED (Expected to ${expectedWord}, did ${expectedWord})`)
            results.push(true);
            continue;
        } else {
            console.log(`    => FAILED (Expected to ${expectedWord}, actually did ${notExpectedWord}`);
            results.push(false);
            continue;
        }
    }

    const numFailed = results.filter((v) => v === false).length;
    if (numFailed > 0) {
        console.log(`FAILED ${numFailed} test(s) failed (${results.length - numFailed} succeeded)`);
        process.exit(1)
    }

    console.log(`PASSED All ${results.length} test(s) succeeded`);
    process.exit(0);
})();
