import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// noinspection JSValidateJSDoc
/** @type {IConfigFile} */
const extractorCfgObject = {
  projectFolder: "<lookup>",
  mainEntryPointFilePath: "<projectFolder>/dist-types/index.d.ts",
  compiler: { tsconfigFilePath: path.join(projectRoot, "tsconfig.json") },
  apiReport: {
    enabled: false,
    reportFileName: "<unscopedPackageName>.api.md",
    reportFolder: "<projectFolder>/etc/",
    reportTempFolder: "<projectFolder>/temp/",
  },
  docModel: {
    enabled: false,
    apiJsonFilePath: "<projectFolder>/temp/<unscopedPackageName>.api.json",
  },
  dtsRollup: {
    enabled: true,
    untrimmedFilePath: "",
    betaTrimmedFilePath: "",
    publicTrimmedFilePath: "<projectFolder>/dist/src/index.d.ts",
    omitTrimmingComments: false,
  },
  tsdocMetadata: {
    enabled: false,
    tsdocMetadataFilePath: "<lookup>",
  },
  messages: {
    compilerMessageReporting: {
      default: { logLevel: "warning" },
    },
    extractorMessageReporting: {
      default: { logLevel: "warning" },
      "ae-missing-release-tag": { logLevel: "none" },
    },
  },
};

const packageJsonFullPath = path.join(projectRoot, "package.json");
const extractorCfg = ExtractorConfig.prepare({
  projectFolderLookupToken: projectRoot,
  packageJsonFullPath,
  packageJson: JSON.parse(await fs.readFile(packageJsonFullPath, "utf8")),
  configObjectFullPath: path.join(projectRoot, "api-extractor.json"),
  configObject: extractorCfgObject,
});
const extractorRes = Extractor.invoke(extractorCfg, {
  localBuild: true,
  showVerboseMessages: true,
});
if (extractorRes.errorCount + extractorRes.warningCount > 0) {
  process.exitCode = 1;
}
