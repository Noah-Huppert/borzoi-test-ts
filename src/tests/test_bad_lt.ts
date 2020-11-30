import Tester, { RuntimeTester } from "../index";

const T = new Tester("The tests should fail", (T: RuntimeTester) => {
    T.test("lt()", (T: RuntimeTester) => {
        T.assert("Less than")
            .actual(6)
            .lt(2);
    });
});

T.execute();
