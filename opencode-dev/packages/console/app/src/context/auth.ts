import { getRequestEvent } from "solid-js/web"
import { and, Database, eq, inArray, isNull, sql } from "@opencode-ai/console-core/drizzle/index.js"
import { UserTable } from "@opencode-ai/console-core/schema/user.sql.js"
import { redirect } from "@solidjs/router"
import { Actor } from "@opencode-ai/console-core/actor.js"

import { createClient } from "@openauthjs/openauth/client"
import { useAuthSession } from "./auth.session"

export const AuthClient = createClient({
  clientID: "app",
  issuer: import.meta.env.VITE_AUTH_URL,
})

export const getActor = async (workspace?: string): Promise<Actor.Info> => {
  "use server"
  const evt = getRequestEvent()
  if (!evt) throw new Error("No request event")
  if (evt.locals.actor) return evt.locals.actor
  evt.locals.actor = (async () => {
    const auth = await useAuthSession()
    if (!workspace) {
      const account = auth.data.account ?? {}
      const current = account[auth.data.current ?? ""]
      if (current) {
        return {
          type: "account",
          properties: {
            email: current.email,
            accountID: current.id,
          },
        }
      }
      if (Object.keys(account).length > 0) {
        const current = Object.values(account)[0]
        await auth.update((val) => ({
          ...val,
          current: current.id,
        }))
        return {
          type: "account",
          properties: {
            email: current.email,
            accountID: current.id,
          },
        }
      }
      return {
        type: "public",
        properties: {},
      }
    }
    const accounts = Object.keys(auth.data.account ?? {})
    if (accounts.length) {
      const user = await Database.use((tx) =>
        tx
          .select()
          .from(UserTable)
          .where(
            and(
              eq(UserTable.workspaceID, workspace),
              isNull(UserTable.timeDeleted),
              inArray(UserTable.accountID, accounts),
            ),
          )
          .limit(1)
          .execute()
          .then((x) => x[0]),
      )
      if (user) {
        await Database.use((tx) =>
          tx
            .update(UserTable)
            .set({ timeSeen: sql`now()` })
            .where(and(eq(UserTable.workspaceID, workspace), eq(UserTable.id, user.id))),
        )
        return {
          type: "user",
          properties: {
            userID: user.id,
            workspaceID: user.workspaceID,
            accountID: user.accountID,
            role: user.role,
          },
        }
      }
    }
    throw redirect("/auth/authorize")
  })()
  return evt.locals.actor
}
