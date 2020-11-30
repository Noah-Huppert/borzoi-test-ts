import Tester, { RuntimeTester } from "../index";

const T = new Tester("The tests should fail", (T: RuntimeTester) => {
    T.test("eq()", (T: RuntimeTester) => {
        T.assert("Equal")
            .actual(false)
            .eq(true);
    });
});

T.execute();
