import { bigint, boolean, int, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core"
import { timestamps, ulid, utc, workspaceColumns } from "../drizzle/types"
import { workspaceIndexes } from "./workspace.sql"

export const BillingTable = mysqlTable(
  "billing",
  {
    ...workspaceColumns,
    ...timestamps,
    customerID: varchar("customer_id", { length: 255 }),
    paymentMethodID: varchar("payment_method_id", { length: 255 }),
    paymentMethodType: varchar("payment_method_type", { length: 32 }),
    paymentMethodLast4: varchar("payment_method_last4", { length: 4 }),
    balance: bigint("balance", { mode: "number" }).notNull(),
    monthlyLimit: int("monthly_limit"),
    monthlyUsage: bigint("monthly_usage", { mode: "number" }),
    timeMonthlyUsageUpdated: utc("time_monthly_usage_updated"),
    reload: boolean("reload"),
    reloadError: varchar("reload_error", { length: 255 }),
    timeReloadError: utc("time_reload_error"),
    timeReloadLockedTill: utc("time_reload_locked_till"),
  },
  (table) => [...workspaceIndexes(table), uniqueIndex("global_customer_id").on(table.customerID)],
)

export const PaymentTable = mysqlTable(
  "payment",
  {
    ...workspaceColumns,
    ...timestamps,
    customerID: varchar("customer_id", { length: 255 }),
    invoiceID: varchar("invoice_id", { length: 255 }),
    paymentID: varchar("payment_id", { length: 255 }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    timeRefunded: utc("time_refunded"),
  },
  (table) => [...workspaceIndexes(table)],
)

export const UsageTable = mysqlTable(
  "usage",
  {
    ...workspaceColumns,
    ...timestamps,
    model: varchar("model", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    inputTokens: int("input_tokens").notNull(),
    outputTokens: int("output_tokens").notNull(),
    reasoningTokens: int("reasoning_tokens"),
    cacheReadTokens: int("cache_read_tokens"),
    cacheWrite5mTokens: int("cache_write_5m_tokens"),
    cacheWrite1hTokens: int("cache_write_1h_tokens"),
    cost: bigint("cost", { mode: "number" }).notNull(),
    keyID: ulid("key_id"),
  },
  (table) => [...workspaceIndexes(table)],
)
