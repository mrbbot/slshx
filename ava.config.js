export default {
  files: ["test/**/*.spec.ts", "test/**/*.spec.tsx"],
  nodeArguments: ["--no-warnings", "--experimental-vm-modules"],
  typescript: {
    compile: false,
    extensions: ["ts", "tsx"],
    rewritePaths: { "test/": "dist/test/" },
  },
};
