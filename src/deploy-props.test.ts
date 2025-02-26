import { getDeployProps } from "./deploy-props";

describe("getDeployProps", () => {
  test("version branch", () => {
    expect(getDeployProps("refs/tags/v1.2.3")).toEqual({
      deployPath: "version/v1.2.3",
      version: "v1.2.3",
    });
  });
  
  describe("Pivotal Tracker branches", () => {
    test("prefixed story id", () => {
      expect(getDeployProps("refs/heads/123456789-test-branch")).toEqual({
        deployPath: "branch/test-branch",
        branch: "test-branch",
      });
    });
    
    test("prefixed story id with '#'", () => {
      expect(getDeployProps("refs/heads/#123456789-test-branch")).toEqual({
        deployPath: "branch/test-branch",
        branch: "test-branch",
      });
    });
    
    test("suffixed branch", () => {
      expect(getDeployProps("refs/heads/test-branch-123456789")).toEqual({
        deployPath: "branch/test-branch",
        branch: "test-branch",
      });
    });
    
    test("suffixed branch with '#'", () => {
      expect(getDeployProps("refs/heads/test-branch-#123456789")).toEqual({
        deployPath: "branch/test-branch",
        branch: "test-branch",
      });
    });  
  });

  describe("Jira branches", () => {
    test("prefixed issue id", () => {
      expect(getDeployProps("refs/heads/PROJ-123-test-branch")).toEqual({
        deployPath: "branch/test-branch",
        branch: "test-branch",
      });
      expect(getDeployProps("refs/heads/PROJ-5-test-branch")).toEqual({
        deployPath: "branch/test-branch",
        branch: "test-branch",
      });
    });    
  });

  it("handles plain branch", () => {
    expect(getDeployProps("refs/heads/test-branch")).toEqual({
      deployPath: "branch/test-branch",
      branch: "test-branch",
    });
  });
    
});
