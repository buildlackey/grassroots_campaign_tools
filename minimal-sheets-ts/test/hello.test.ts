import { sayHello } from "../src/hello";

test("sayHello returns expected greeting", () => {
  expect(sayHello("Chris")).toBe("Hello, Chris");
});
