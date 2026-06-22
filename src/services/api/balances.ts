import api, { clampPageSize } from '@/services/api/api.ts'
import type { UserModel } from '@/models/userModel.ts'

export type TransactionPartyType = 'User' | 'System' | number
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

export interface TransactionPartyModel {
  partyType: TransactionPartyType
  user: UserModel | null
}

export interface BalanceTransactionModel {
  id: string
  sender: TransactionPartyModel
  receiver: TransactionPartyModel
  currencyId: number
  amount: number
  transactionDate: string
  type: TransactionType
  status: TransactionStatus
  sourceType: TransactionSourceType
}

export interface GetBalanceTransactionsRequest {
  rangeStart: string
  rangeEnd: string
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
  userId: string
  direction: SystemTransactionDirection
  amount: number
  currencyId: number
  transactionDateTime: string
  forcePayment?: boolean
}

export async function getBalanceTransactions(
  req: GetBalanceTransactionsRequest,
): Promise<GetBalanceTransactionsResponse> {
  const resp = await api.get<GetBalanceTransactionsResponse>('/main/transactions', {
    params: {
      rangeStart: req.rangeStart,
      rangeEnd: req.rangeEnd,
      currencyId: req.currencyId || undefined,
      senderId: req.senderId || undefined,
      receiverId: req.receiverId || undefined,
      logicalOperator: req.logicalOperator,
      skipReversed: req.skipReversed,
      cursorId: req.cursorId || undefined,
      cursorDate: req.cursorDate || undefined,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}

export async function createSystemBalanceTransaction(req: CreateSystemBalanceTransactionRequest): Promise<void> {
  await api.post('/main/transactions', req)
}

export async function deleteBalanceTransaction(id: string, forcePayment = false): Promise<void> {
  await api.delete(`/main/transactions/${id}`, {
    params: forcePayment ? { forcePayment } : undefined,
  })
}
