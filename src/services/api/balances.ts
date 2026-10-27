import { clampPageSize } from './api'
import type { OrganizationModel } from '@/models/organizationModel'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { mapTransaction } from '@/services/graphql/operationMapping'
import { ListTransactionsDocument, CreateTransactionDocument, ReverseTransactionDocument } from '@/graphql/generated/graphql'
import { toUtcDateTimeString } from '@/utils/dateTime'

export type TransactionType = 'Transfer' | 'Refund' | 'Fee' | 'Adjustment' | number
export type TransactionStatus =
  | 'Pending'
  | 'Completed'
  | 'CompletionApplied'
  | 'Reversed'
  | 'ReversedApplied'
  | 'CompletionProfileApplied'
  | 'ReversalProfileApplied'
  | string
  | number
export type TransactionLogicalOperator = 'And' | 'Or'
export type TransactionSourceType = 'Manual' | 'Purchase' | 'Sale' | 'Logistic' | number

export interface BalanceTransactionModel {
  id: string
  sender: OrganizationModel
  receiver: OrganizationModel
  currencyId: number
  amount: number
  transactionDate: string
  type: TransactionType
  status: TransactionStatus
  sourceType: TransactionSourceType
}

export interface GetBalanceTransactionsRequest {
  rangeStart?: string
  rangeEnd?: string
  currencyId?: number | null
  senderId?: string | null
  receiverId?: string | null
  logicalOperator: TransactionLogicalOperator
  skipReversed: boolean
  cursorId?: string | null
  cursorDate?: string | null
  size: number
}

export interface GetBalanceTransactionsResponse {
  transactions: BalanceTransactionModel[]
}

export type SystemTransactionDirection = 'UserToSystem' | 'SystemToUser'

export interface CreateSystemBalanceTransactionRequest {
  organizationId: string
  direction: SystemTransactionDirection
  amount: number
  currencyId: number
  transactionDateTime: string
  forcePayment?: boolean
}

export async function getBalanceTransactions(req: GetBalanceTransactionsRequest): Promise<GetBalanceTransactionsResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: ListTransactionsDocument, variables: { input: {
    rangeStart: req.rangeStart ? toUtcDateTimeString(req.rangeStart) : undefined,
    rangeEnd: req.rangeEnd ? toUtcDateTimeString(req.rangeEnd) : undefined,
    currencyId: req.currencyId, senderId: req.senderId, receiverId: req.receiverId,
    logicalOperation: req.logicalOperator === 'Or' ? 'OR' : 'AND', skipReversed: req.skipReversed,
    cursor: { size: clampPageSize(req.size), value: req.cursorId && req.cursorDate ? { id: req.cursorId, transactionDate: toUtcDateTimeString(req.cursorDate) } : null },
  } }, fetchPolicy: 'no-cache' }))
  return { transactions: data.transactions.list.map(mapTransaction) }
}
export async function createSystemBalanceTransaction(req: CreateSystemBalanceTransactionRequest): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: CreateTransactionDocument, variables: { input: {
    ...req, direction: req.direction === 'UserToSystem' ? 'USER_TO_SYSTEM' : 'SYSTEM_TO_USER', transactionDateTime: toUtcDateTimeString(req.transactionDateTime),
  } } }))
}
export async function deleteBalanceTransaction(id: string, forcePayment = false): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: ReverseTransactionDocument, variables: { input: { transactionId: id, forcePayment } } }))
}
