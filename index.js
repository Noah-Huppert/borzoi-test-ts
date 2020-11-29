/**
 * Convert a boolean into a check or x emoji.
 * @param value {boolean} To transform into emoji.
 * @returns {string} Check emoji if value is true, x emoji if false.
 */
function booleanToEmoji(value) {
    if (value === true) {
	   return '✔️';
    }
    
    return '❌';
}

const COLOR_RESET = '\x1b[0m';
const COLOR_FG_BLACK = '\x1b[30m';
const COLOR_BG_RED = '\x1b[41m';
const COLOR_BG_GREEN = '\x1b[42m';

/**
 * Convert a boolean into console color codes.
 * @param value {boolean} To transform into color codes.
 * @returns {string} Console color code green if value is true, red if false.
 */
function booleanToColor(value) {
    if (value === true) {
        return COLOR_FG_BLACK + COLOR_BG_GREEN;
    }
    
    return COLOR_FG_BLACK + COLOR_BG_RED;
}

/**
 * Emulate Array.map functionality for objects.
 * @param obj {Object} To iterate over.
 * @param fn {function(key, value)} Function to run for each key in the object. The 
 *     object key is passed as the first argument, value as the second. Expected to
 *     return an item just like Array.map.
 * @returns {any[]} Array of items returned by your map function.
 */
function objMap(obj, fn) {
    return Object.keys(obj)
        .map((key) => {
            return fn(key, obj[key]);
        });
}

/**
 * Main testing interface which library provides.
 */
export default class Tester {
    /**
	* Define a test.
	* @param subject {string} Description of test.
	* @param fn {function(Tester)} Function which performs the test. Passed a 
	*     RuntimeTester instance which allows you to run assertions and
	*     register sub-tests.
	*/
    constructor(subject, fn) {
        this.subject = subject;
        this.fn = fn;
    }

    /**
	* Run tests and return a results object. If you are a user and just want to run
	* your tests and have the results printed to the console use execute() instead!
	* @returns 
	*/
    async run() {
        // Collect assertions and children
	   const runtimeTester = new RuntimeTester();
        await this.fn(runtimeTester);

        const assertRes = objMap(runtimeTester.assertions, (key, a) => {
            return a.run();
        });
        const childrenRes = await Promise.all(runtimeTester.children.map(async (c) => {
            return await c.run();
        }));

        return {
            subject: this.subject,
            assertions: assertRes,
            children: childrenRes,
        };
    }

    resultCheck(res) {
        const failedAsserts = res.assertions
            .filter(a => a.result === false).length > 0;
        const failedChildren = res.children
            .map(c => this.resultCheck(c))
            .filter(r => r === false).length > 0;

        return failedAsserts === false && failedChildren === false;
    }

    resultToString(res, depth) {
        const out = [];
        
        let indent = '';
        if (depth !== undefined) {
            for (let i = 0; i < depth; i++) {
                indent += '  ';
            }
        } else {
            depth = 0;
        }

        const passed = this.resultCheck(res);
        const passedStr = booleanToEmoji(passed);

        const colorStr = booleanToColor(passed);

        out.push(`${indent}${colorStr}${passedStr}${COLOR_RESET} ${res.subject}`);
        
        res.assertions.forEach((a) => {
            if (a.result === true) {
                return;
            }

            const resultStr = booleanToEmoji(a.result);
            const colorStr = booleanToColor(a.result);
            
            out.push(`${indent}  ${colorStr}${resultStr}${COLOR_RESET} ${a.subject} (Expected ${a.typeWords}: "${a.expected}", Actual: "${a.actual}")`);
        });

        res.children
            .map((c) => this.resultToString(c, depth + 1))
            .forEach((childOut) => {
                childOut.forEach((l) => out.push(l));
            });
        return out;
    }

    async execute() {
	   const res = await this.run();
	   
	   console.log(T.resultToString(res).join('\n'));

	   let exitCode = 0;
	   if (T.resultCheck(res) === false) {
		  console.log('TESTS FAILED');
		  exitCode = 1;
	   } else {
		  console.log('GOOD');
	   }

	   process.exit(exitCode);
    }
}

/**
 * Holds the results of tests.
 */
class TestResult {
    // TODO Migrate result* functions and data here
}

class RuntimeTester {
    constructor() {
        this.assertions = {};
        this.children = [];
    }
    
    test(subject, fn) {
        this.children.push(new Tester(subject, fn));
        return this;
    }b8nm
    
    assert(subject) {
        if (Object.keys(this.assertions).indexOf(subject) !== -1) {
            throw `Assertion with subject "${subject}" already exists and cannot be replaced`;
        }
        
        this.assertions[subject] = new Assertion();

        return this.assertions[subject];
    }
}

class Assertion {
    constructor() {
        this.subject = subject;
        this.result = undefined;
            
        this.actualValue = undefined;
        this.expectedValue = undefined;
        this.type = 'eq';
    }
    
    actual(value) {
        this.actualValue = value;
        return this;
    }
    
    expected(value) {
        this.expectedValue = value;
        return this;
    }
    
    ne(value) {
        this.expectedValue = value;
        this.type = 'ne';
    }
    
    gt(value) {
        this.expectedValue = value;
        this.type = 'gt';
    }
    
    lt(value) {
        this.expectedValue = value;
        this.type = 'lt';
    }
    
    gte(value) {
        this.expectedValue = value;
        this.type = 'gte';
    }
    
    lte(value) {
        this.expectedValue = value;
        this.type = 'lte';
    }
    
    run:() {
        let result = true;
        let typeSymbol = '';
        let typeWords = '';
        
        switch (this.type) {
        case 'eq':
            result = this.actualValue === this.expectedValue;
            typeSymbol = '===';
            typeWords = 'equal';
            break;
        case 'ne':
            result = this.actualValue !== this.expectedValue;
            typeSymbol = '!==';
            typeWords = 'not equal';
            break;
        case 'gt':
            result = this.actualValue > this.expectedValue;
            typeSymbol = '>';
            typeWords = 'greater than';
            break;
        case 'lt':
            result = this.actualValue < this.expectedValue;
            typeSymbol = '<';
            typeWords = 'less than';
            break;
        case 'gte':
            result = this.actualValue >= this.expectedValue;
            typeSymbol = '>=';
            typeWords = 'greater than or equal to';
            break;
        case 'lte':
            result = this.actualValue <= this.expectedValue;
            typeSymbol = '<=';
            typeWords = 'less than or equal to';
            break;
        }
        
        return {
            actual: this.actualValue,
            expected: this.expectedValue,
            type: this.type,
            typeSymbol: typeSymbol,
            typeWords: typeWords,
            result: result,
            subject: this.subject,
        };
    }
}
