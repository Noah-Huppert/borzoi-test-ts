import Tester, { RuntimeTester } from "../index";

const T = new Tester("The tests should fail", (T: RuntimeTester) => {
    T.test("lte()", (T: RuntimeTester) => {
        T.assert("Less than or equal to")
            .actual(5)
            .lte(3);
    });
});

T.execute();
