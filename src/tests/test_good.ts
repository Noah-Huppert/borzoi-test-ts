import Tester, { RuntimeTester } from "../index";

const T = new Tester("The tests should succeed", (T: RuntimeTester) => {
    T.test("eq()", (T: RuntimeTester) => {
        T.assert("Equal")
            .actual(false)
            .eq(false);
    });

    T.test("gt()", (T: RuntimeTester) => {
        T.assert("Greater than")
            .actual(6)
            .gt(2);
    });

    T.test("lt()", (T: RuntimeTester) => {
        T.assert("Less than")
            .actual(6)
            .lt(10);
    });

    T.test("ne()", (T: RuntimeTester) => {
        T.assert("Not equal")
            .actual("foo")
            .ne("goo");
    });

    T.test("gte()", (T: RuntimeTester) => {
        T.assert("Greater than or equal to")
            .actual(5)
            .gte(5);
    });

    T.test("lte()", (T: RuntimeTester) => {
        T.assert("Less than or equal to")
            .actual(5)
            .lte(5);
    });
});

T.execute();
