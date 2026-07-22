import api, { clampPageSize } from '@/services/api/api.ts'
import {
  mapOrganizationModel,
  type OrganizationDto,
  type OrganizationModel,
} from '@/models/organizationModel.ts'

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

interface BalanceTransactionDto extends Omit<BalanceTransactionModel, 'sender' | 'receiver'> {
  sender: OrganizationDto
  receiver: OrganizationDto
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

export async function getBalanceTransactions(
  req: GetBalanceTransactionsRequest,
): Promise<GetBalanceTransactionsResponse> {
  const resp = await api.get<{ transactions: BalanceTransactionDto[] }>('/main/transactions', {
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

  return {
    transactions: resp.data.transactions.map((transaction) => ({
      ...transaction,
      sender: mapOrganizationModel(transaction.sender),
      receiver: mapOrganizationModel(transaction.receiver),
    })),
  }
}

export async function createSystemBalanceTransaction(req: CreateSystemBalanceTransactionRequest): Promise<void> {
  await api.post('/main/transactions', req)
}

export async function deleteBalanceTransaction(id: string, forcePayment = false): Promise<void> {
  await api.delete(`/main/transactions/${id}`, {
    params: forcePayment ? { forcePayment } : undefined,
  })
}
