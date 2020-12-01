# Borzoi JS Test
JavaScript ES6 testing library.

# Table Of Contents
- [Overview](#overview)

# Overview
Borzoi test implements a simple fluid familiar testing pattern, compatible with 
ES6 modules.

To use:

```
npm install --save-dev borzoi-test
```

Then require `Tester` (default export) and `RuntimeTester` (named export):

```js
import Tester, { RuntimeTester } from "borzoi-test";
```

Next create an instance of a `Tester`. The constructor takes a subject and test 
function as arguments:

```js
const T = new Tester("A short blurb about what I am testing", (T: RuntimeTester) => {
    // ...
});
```

The second argument, the test function, defines the test logic itself. This 
function is provided a `RuntimeTester` instance as an argument. With this you 
can define assertions or define sub-tests.

```js
/**
 * An example function which is being tested.
 * @returns A value.
 */
function foo(): string {
    return "A_VALUE";
}

const T = new Tester("A short blurb about what I am testing", (T: RuntimeTester) => {
    // Define assertions
    T.assert("A short description of what is being asserted")
        .actual(foo())
        .eq("A_VALUE"); // Can use: ne(), lt(), gt(), lte(), gte() as well
        
    // Define sub-tests
    T.test("Another short blurb, a sub-test", (T: RuntimeTester) => {
        // ... Do sub-tests here ....
    });
});
```

Assertions are defined in a fluid style, calling `T.assert()` returns an 
`Assertion` instance. The `Assertion` class defines the `actual()` method which
allows you to provide the value being tested by the assertion. Additionally the
`eq()` (equal), `ne()` (not equal), `lt()` (less than), `gt()` (greater than),
`lte()` (less than or equal), and `gte()` (greater than or equal) methods let 
you provide the expected value and decide how the actual and expected values are
compared.

The `RuntimeTester` `test()` method works exactly the same as the `Tester` 
constructor. The first argument is a subject description and the second argument
is the test function.
