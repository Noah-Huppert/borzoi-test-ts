import Tester, { RuntimeTester } from "../index";

const T = new Tester("The tests should fail", (T: RuntimeTester) => {
    T.test("gt()", (T: RuntimeTester) => {
        T.assert("Greater than")
            .actual(6)
            .gt(10);
    });
});

T.execute();
