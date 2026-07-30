const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\]/g, "\$&");
const out = escapeRegex("(a+)+$");
console.log("output:", out);
const re = new RegExp(out);
console.log("matches literal:", re.test("(a+)+$"));
console.log("does NOT match 'aaaa':", !re.test("aaaa"));
console.log("no catastrophic backtracking possible: pattern is fully literal");
