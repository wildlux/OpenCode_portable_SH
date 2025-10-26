import { Config } from "../../../config/config"
import { bootstrap } from "../../bootstrap"
import { cmd } from "../cmd"

export const ConfigCommand = cmd({
  command: "config",
  builder: (yargs) => yargs,
  async handler() {
    await bootstrap(process.cwd(), async () => {
      const config = await Config.get()
      console.log(JSON.stringify(config, null, 2))
    })
  },
})
