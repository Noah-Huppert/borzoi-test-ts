import Tester, { RuntimeTester } from "../index";

const T = new Tester("The tests should fail", (T: RuntimeTester) => {
    T.test("ne()", (T: RuntimeTester) => {
        T.assert("Not equal")
            .actual("foo")
            .ne("foo");
    });
});

T.execute();
