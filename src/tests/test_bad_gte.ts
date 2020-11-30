import Tester, { RuntimeTester } from "../index";

const T = new Tester("The tests should fail", (T: RuntimeTester) => {
    T.test("gte()", (T: RuntimeTester) => {
        T.assert("Greater than or equal to")
            .actual(5)
            .gte(7);
    });
});

T.execute();
