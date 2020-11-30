/**
 * Converts a boolean to a check or x emoji.
 * @param value To convert.
 * @returns Emoji.
 */
function booleanToEmoji(value: boolean): string {
    let passedStr = "✔️";
    if (value === false) {
        passedStr = "❌";
    }

    return passedStr;
}

/**
 * Console color code to reset any previously set foreground and background colors.
 */
const COLOR_RESET = "\x1b[0m";

/**
 * Console color code for black text.
 */
const COLOR_FG_BLACK = "\x1b[30m";

/**
 * Console color code for red background.
 */
const COLOR_BG_RED = "\x1b[41m";

/**
 * Console color code for green background.
 */
const COLOR_BG_GREEN = "\x1b[42m";

/**
 * Converts a boolean to a console color code string. Always black text, green background
 * for true, red background for false.
 * @param value To convert.
 * @returns Console color codes.
 */
function booleanToColor(value: boolean): string {
    if (value === true) {
        return COLOR_FG_BLACK + COLOR_BG_GREEN;
    }

    return COLOR_FG_BLACK + COLOR_BG_RED;
}


/**
 * Call a function on all top level keys on an object. This function should return a value
 * which will be placed into an array. This array will be returned.
 * @param obj To iterate over.
 * @param fn Callback function.
 * @returns Array of results which were returned from the fn.
 */
function objArrMap(obj: {[index: string]: any}, fn: (key: string, value: any) => any): any[] {
    return Object.keys(obj)
        .map((key: string): any => {
            return fn(key, obj[key]);
        });
}

/**
 * Records test definitions and runs them.
 */
export default class Tester {
    /**
     * Description of what is being tested.
     */
    subject: string;

    /**
     * Function which runs test.
     */
    fn: (T: RuntimeTester) => void;

    /**
     * Create a new Tester.
     * @param subject Description of what is being tested.
     * @param fn Function which runs test.
     */
    constructor(subject: string, fn: (T: RuntimeTester) => void) {
        this.subject = subject;
        this.fn = fn;
    }

    /**
     * Run tests.
     * @returns Test results.
     */
    async runTests(): Promise<TestResult> {
        // Collect assertions and children
        const runtimeTester = new RuntimeTester();
        
        await this.fn(runtimeTester);

        const assertRes = objArrMap(runtimeTester.assertions, (key, a) => {
            return a.runTests();
        });
        const childrenRes = await Promise.all(runtimeTester.children.map(async (c) => {
            return await c.runTests();
        }));

        return new TestResult(this.subject, assertRes, childrenRes);
    }

    /**
     * Run tests, print the results to the console, and exit the process with an 
     * appropriate exit code (0 if success, 1 if failure).
     */
    async execute() { 
        const res = await this.runTests();
        
        console.log(res.toString().join('\n'));

        let exitCode = 0;
        if (res.check() === false) {
            console.log('TESTS FAILED');
            exitCode = 1;
        } else {
            console.log('TESTS SUCCEEDED');
        }

        process.exit(exitCode);
    }
}

/**
 * Records the result of a test.
 */
class TestResult {
    /**
     * Description of what is being tested.
     */
    subject: string;

    /**
     * Results of test's assertions.
     */
    assertions: AssertionResult[];

    /**
     * Child sub-test results.
     */
    children: TestResult[];

    /**
     * Construct a new TestResult instance.
     * @param subject Description of what is being tested.
     * @param assertions Results of test's assertions.
     * @param children Child sub-test results.
     */
    constructor(subject: string, assertions: AssertionResult[], children: TestResult[]) {
        this.subject = subject;
        this.assertions = assertions;
        this.children = children;
    }

    /**
     * Check if a result indicates success or failure.
     * @returns True if a success, false if failure.
     */
    check(): boolean {
        const failedAsserts = this.assertions
            .filter(a => a.result === false).length > 0;
        const failedChildren = this.children
            .map(c => c.check())
            .filter(r => r === false).length > 0;

        return failedAsserts === false && failedChildren === false;
    }

    /**
     * Convert test results to a summary string.
     * @param callDepth Number of sub-tests deep the current test result being converted to
     *     to a string is. This will be used to ensure appropriate indentation. If not
     *     provided defaults to 0.
     * @returns Array of output strings, each item in the array is a new line. Returning
     *     an array makes it easy for calls to children test results to be correctly 
     *     indented by their parent test result's toString() method.
     */
    toString(callDepth?: number): string[] {
        const out = [];
        
        let depth = 0;
        if (depth !== undefined && depth !== null) {
            // Cast required bc Typescript doesn't recognize that depth can't be undefined
            // or null here.
            depth = callDepth as number;
        }
        
        let indent = "";
        for (let i = 0; i < depth; i++) {
            indent += "  ";
        }


        const passed = this.check();
        const passedStr = booleanToEmoji(passed);

        const colorStr = booleanToColor(passed);

        out.push(`${indent}${colorStr}${passedStr}${COLOR_RESET} ${this.subject}`);
        
        this.assertions.forEach((a: any) => {
            if (a.result === true) {
                return;
            }

            const resultStr = booleanToEmoji(a.result);
            const colorStr = booleanToColor(a.result);
            
            out.push(`${indent}  ${colorStr}${resultStr}${COLOR_RESET} ${a.subject} (Expected ${a.comparisonWords}: "${a.expected}", Actual: "${a.actual}")`);
        });

        this.children
            .map((c) => this.toString(depth + 1))
            .forEach((childOut: string[]) => {
                childOut.forEach((l) => out.push(l));
            });
        
        return out;
    }
}

/**
 * Interface provided to Tester functions which allows definitions of sub-tests and
 * of assertions.
 */
class RuntimeTester {
    /**
     * Assertions defined during the test execution.
     */
    assertions: Map<string, Assertion>;

    /**
     * Children tests defined during the test's execution.
     */
    children: Tester[];

    /**
     * Create a RuntimeTester.
     */
    constructor() {
        this.assertions = new Map();
        this.children = [];
    }

    /**
     * Define a sub-test.
     * @param subject Description of what is being tested.
     * @param fn Function which runs the test.
     * @returns This.
     */
    test(subject: string, fn: (T: RuntimeTester) => void): RuntimeTester {
        this.children.push(new Tester(subject, fn));
        return this;
    }

    /**
     * Define a test assertion. 
     * @param subject Description of what is being asserted. This must be unique in
     *     this test.
     * @returns Assertion.
     */
    assert(subject: string): Assertion {
        if (Object.keys(this.assertions).indexOf(subject) !== -1) {
            throw `Assertion with subject "${subject}" already exists and cannot be replaced`;
        }
        
        this.assertions.set(subject, new Assertion(subject));

        // Type cast required here because Typescript doesn't recognize that the result
        // can't be undefined here.
        return this.assertions.get(subject) as Assertion;
    }
};

/**
 * A check to ensure a value during a test has the expected result.
 */
class Assertion {
    /**
     * Description of what is being asserted.
     */
    subject: string;

    /**
     * The value the test generates which we are checking.
     */
    actualValue: any;

    /**
     * Expected test value, we will compared actualValue to this.
     */
    expectedValue: any;

    /**
     * How actualValue and expectedValue are compared. This will be set by the different
     * comparison functions Assertion provides.
     */
    comparison: string;

    /**
     * Creates a new Assertion instance.
     * @params subject Description of what is being asserted.
     */
    constructor(subject: string) {
        this.subject = subject;

        this.actualValue = undefined;
        this.expectedValue = undefined;
        this.comparison = "eq";
    }

    /**
     * Records the actual value for the assertion.
     * @param value To record.
     * @returns This.
     */
    actual(value: any): Assertion {
        this.actualValue = value;
        return this;
    }

    /**
     * Records that we expect the actual value to be exactly equal to this value.
     * @param value To record.
     * @returns This.
     */
    eq(value: any): Assertion {
        this.expectedValue = value;
        this.comparison = "eq";
        return this;
    }

    /**
     * Records that we expect the actual value to be anything but this value.
     * @param value To record.
     * @returns This.
     */
    ne(value: any): Assertion {
        this.expectedValue = value;
        this.comparison = "ne";
        return this;
    }

    /**
     * Records that we expect the actual value to be greater than this value.
     * @param value To record.
     * @returns This.
     */
    gt(value: any): Assertion {
        this.expectedValue = value;
        this.comparison = "gt";
        return this;
    }

    /**
     * Records that we expect the actual value to be less than this value.
     * @param value To record.
     * @returns This.
     */
    lt(value: any): Assertion {
        this.expectedValue = value;
        this.comparison = "lt";
        return this;
    }

    /**
     * Records that we expect the actual value to be greater than or equal to this value.
     * @param value To record.
     * @returns This.
     */
    gte(value: any): Assertion {
        this.expectedValue = value;
        this.comparison = "gte";
        return this;
    }

    /**
     * Records that we expect the actual value to be less than or equal to this value.
     * @param value To record.
     * @returns This.
     */
    lte(value: any): Assertion {
        this.expectedValue = value;
        this.comparison = "lte";
        return this;
    }

    /**
     * Runs the comparision between the actual and expected value.
     * @returns Comparision results.
     */
    run(): AssertionResult {
        let result = true;
        let comparisonSymbol = "";
        let comparisonWords = "";
        
        switch (this.comparison) {
            case "eq":
                result = this.actualValue === this.expectedValue;
                comparisonSymbol = "===";
                comparisonWords = "equal";
                break;
            case "ne":
                result = this.actualValue !== this.expectedValue;
                comparisonSymbol = "!==";
                comparisonWords = "not equal";
                break;
            case "gt":
                result = this.actualValue > this.expectedValue;
                comparisonSymbol = ">";
                comparisonWords = "greater than";
                break;
            case "lt":
                result = this.actualValue < this.expectedValue;
                comparisonSymbol = "<";
                comparisonWords = "less than";
                break;
            case "gte":
                result = this.actualValue >= this.expectedValue;
                comparisonSymbol = ">=";
                comparisonWords = "greater than or equal to";
                break;
            case "lte":
                result = this.actualValue <= this.expectedValue;
                comparisonSymbol = "<=";
                comparisonWords = "less than or equal to";
                break;
        }
        
        return {
            actual: this.actualValue,
            expected: this.expectedValue,
            comparison: this.comparison,
            comparisonSymbol: comparisonSymbol,
            comparisonWords: comparisonWords,
            result: result,
            subject: this.subject,
        };
    }
}

/**
 * Records the result of an assertion.
 */
interface AssertionResult {
    /**
     * The actual value as generated by the test.
     */
    actual: any;

    /**
     * The value we expect.
     */
    expected: any;

    /**
     * Internal code used to indicate what type of comparison was done for the assertion.
     */
    comparison: string;

    /**
     * Mathmatical symbol used to represent the comparison.
     */
    comparisonSymbol: string;

    /**
     * Short blurb of English explaining the comparison. Should be a format so it fits 
     * nicely in the middle of a sentence like:
     *     <actual value> <comparisonWords> <expected value>
     */
    comparisonWords: string;

    /**
     * Result of assertion. True if it passed, false otherwise.
     */
    result: boolean;

    /**
     * Description of what is being asserted.
     */
    subject: string;
}
