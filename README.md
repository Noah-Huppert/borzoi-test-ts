# Borzoi JS Test
JavaScript ES6 testing library.

# Table Of Contents
- [Overview](#overview)

# Overview
Borzoi test implements a simple fluid familiar testing pattern, compatible with 
ES6 modules.

```js
import Tester from "borzo-test";

// A simple function to test
function foobar(a, b) {
  return a + b;
}

const T = new Tester("Ensures my app works", async (T) => {
  T.test("foobar()", async (T) => {
    // Can do simple assertions
    T.assert("Adds arguments correctly")
	  .actual(foobar(3, 4))
	  .except(7);
	  
	// Can do something more complex
	T.assert("Result larger than argument a")
	  .actual(foobar(3, 4))
	  .gt(3);
  });
});

// Run tests
T.execute()
```
