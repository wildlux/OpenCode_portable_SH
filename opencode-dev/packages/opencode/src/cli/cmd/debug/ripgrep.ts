import { EOL } from "os"
import { Ripgrep } from "../../../file/ripgrep"
import { Instance } from "../../../project/instance"
import { bootstrap } from "../../bootstrap"
import { cmd } from "../cmd"

export const RipgrepCommand = cmd({
  command: "rg",
  builder: (yargs) => yargs.command(TreeCommand).command(FilesCommand).command(SearchCommand).demandCommand(),
  async handler() {},
})

const TreeCommand = cmd({
  command: "tree",
  builder: (yargs) =>
    yargs.option("limit", {
      type: "number",
    }),
  async handler(args) {
    await bootstrap(process.cwd(), async () => {
      console.log(await Ripgrep.tree({ cwd: Instance.directory, limit: args.limit }))
    })
  },
})

const FilesCommand = cmd({
  command: "files",
  builder: (yargs) =>
    yargs
      .option("query", {
        type: "string",
        description: "Filter files by query",
      })
      .option("glob", {
        type: "string",
        description: "Glob pattern to match files",
      })
      .option("limit", {
        type: "number",
        description: "Limit number of results",
      }),
  async handler(args) {
    await bootstrap(process.cwd(), async () => {
      const files: string[] = []
      for await (const file of Ripgrep.files({
        cwd: Instance.directory,
        glob: args.glob ? [args.glob] : undefined,
      })) {
        files.push(file)
        if (args.limit && files.length >= args.limit) break
      }
      console.log(files.join(EOL))
    })
  },
})

const SearchCommand = cmd({
  command: "search <pattern>",
  builder: (yargs) =>
    yargs
      .positional("pattern", {
        type: "string",
        demandOption: true,
        description: "Search pattern",
      })
      .option("glob", {
        type: "array",
        description: "File glob patterns",
      })
      .option("limit", {
        type: "number",
        description: "Limit number of results",
      }),
  async handler(args) {
    const results = await Ripgrep.search({
      cwd: process.cwd(),
      pattern: args.pattern,
      glob: args.glob as string[] | undefined,
      limit: args.limit,
    })
    console.log(JSON.stringify(results, null, 2))
  },
})
