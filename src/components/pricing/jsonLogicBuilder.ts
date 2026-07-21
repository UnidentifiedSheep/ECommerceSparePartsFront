export type JsonLogicValue = string | number | boolean | null | JsonLogicRule
export type JsonLogicRule = { [operator: string]: JsonLogicValue | JsonLogicValue[] }

export type LogicNode =
  | { id: string; kind: 'variable'; path: string }
  | { id: string; kind: 'number'; value: number }
  | { id: string; kind: 'text'; value: string }
  | { id: string; kind: 'boolean'; value: boolean }
  | { id: string; kind: 'operation'; operator: string; args: LogicNode[] }

export interface OperatorDefinition {
  value: string
  group: 'arithmetic' | 'comparison' | 'logic' | 'control' | 'text'
  minArgs: number
  maxArgs: number
  result: LogicValueType
}

export type LogicValueType = 'number' | 'boolean' | 'text' | 'any'

export interface VariableDefinition {
  path: string
  type: Exclude<LogicValueType, 'any'>
}

export const operatorDefinitions: OperatorDefinition[] = [
  { value: '+', group: 'arithmetic', minArgs: 2, maxArgs: 8, result: 'number' },
  { value: '-', group: 'arithmetic', minArgs: 2, maxArgs: 2, result: 'number' },
  { value: '*', group: 'arithmetic', minArgs: 2, maxArgs: 8, result: 'number' },
  { value: '/', group: 'arithmetic', minArgs: 2, maxArgs: 2, result: 'number' },
  { value: '%', group: 'arithmetic', minArgs: 2, maxArgs: 2, result: 'number' },
  { value: 'min', group: 'arithmetic', minArgs: 2, maxArgs: 8, result: 'number' },
  { value: 'max', group: 'arithmetic', minArgs: 2, maxArgs: 8, result: 'number' },
  { value: '==', group: 'comparison', minArgs: 2, maxArgs: 2, result: 'boolean' },
  { value: '!=', group: 'comparison', minArgs: 2, maxArgs: 2, result: 'boolean' },
  { value: '>', group: 'comparison', minArgs: 2, maxArgs: 2, result: 'boolean' },
  { value: '>=', group: 'comparison', minArgs: 2, maxArgs: 2, result: 'boolean' },
  { value: '<', group: 'comparison', minArgs: 2, maxArgs: 2, result: 'boolean' },
  { value: '<=', group: 'comparison', minArgs: 2, maxArgs: 2, result: 'boolean' },
  { value: 'and', group: 'logic', minArgs: 2, maxArgs: 8, result: 'boolean' },
  { value: 'or', group: 'logic', minArgs: 2, maxArgs: 8, result: 'boolean' },
  { value: '!', group: 'logic', minArgs: 1, maxArgs: 1, result: 'boolean' },
  { value: 'if', group: 'control', minArgs: 3, maxArgs: 3, result: 'any' },
  { value: 'cat', group: 'text', minArgs: 2, maxArgs: 8, result: 'text' },
  { value: 'in', group: 'text', minArgs: 2, maxArgs: 2, result: 'boolean' },
]

export const variableDefinitions: VariableDefinition[] = [
  { path: 'salePrice', type: 'number' },
  { path: 'cost', type: 'number' },
  { path: 'currencyId', type: 'number' },
  { path: 'candidate.priceOfferId', type: 'text' },
  { path: 'candidate.productId', type: 'number' },
  { path: 'candidate.targetStorageName', type: 'text' },
  { path: 'candidate.sourceType', type: 'text' },
  { path: 'candidate.cost', type: 'number' },
  { path: 'candidate.currencyId', type: 'number' },
  { path: 'candidate.availableQuantity', type: 'number' },
  { path: 'candidate.fulfillment.sourceStorageName', type: 'text' },
  { path: 'candidate.fulfillment.targetStorageName', type: 'text' },
  { path: 'candidate.fulfillment.logisticsCostInBaseCurrency', type: 'number' },
  { path: 'candidate.fulfillment.deliveryTime', type: 'text' },
  { path: 'candidate.fulfillment.guaranteedDeliveryTime', type: 'text' },
  { path: 'candidate.fulfillment.deliveryProbability', type: 'number' },
  { path: 'market.offerCount', type: 'number' },
  { path: 'market.availableQuantity', type: 'number' },
  { path: 'market.hasMarket', type: 'boolean' },
  { path: 'baseMarkup.proportion', type: 'number' },
  { path: 'baseMarkup.amount', type: 'number' },
  { path: 'baseMarkup.resultingPrice', type: 'number' },
]

let nodeSequence = 0

type NodeOfKind<K extends LogicNode['kind']> = Extract<LogicNode, { kind: K }>

function nextNodeId() {
  return `logic-node-${++nodeSequence}`
}

export function createNode(): NodeOfKind<'variable'>
export function createNode<K extends LogicNode['kind']>(kind: K): NodeOfKind<K>
export function createNode(kind: LogicNode['kind'] = 'variable'): LogicNode {
  const id = nextNodeId()
  if (kind === 'number') return { id, kind, value: 0 }
  if (kind === 'text') return { id, kind, value: '' }
  if (kind === 'boolean') return { id, kind, value: true }
  if (kind === 'operation') {
    return {
      id,
      kind,
      operator: '*',
      args: [createNode('variable'), { ...createNode('number'), value: 1 }],
    }
  }
  return { id, kind, path: 'salePrice' }
}

export function parseJsonLogic(value: unknown): LogicNode {
  if (typeof value === 'number') return { ...createNode('number'), value }
  if (typeof value === 'boolean') return { ...createNode('boolean'), value }
  if (typeof value === 'string') return { ...createNode('text'), value }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value)
    if (entries.length === 1) {
      const [operator, rawArgs] = entries[0]!
      if (operator === 'var') {
        const path = Array.isArray(rawArgs) ? rawArgs[0] : rawArgs
        return { ...createNode('variable'), path: typeof path === 'string' ? path : 'salePrice' }
      }
      const args = Array.isArray(rawArgs) ? rawArgs : [rawArgs]
      return {
        id: nextNodeId(),
        kind: 'operation',
        operator,
        args: args.map(parseJsonLogic),
      }
    }
  }

  return createNode('variable')
}

export function serializeJsonLogic(node: LogicNode): JsonLogicValue {
  if (node.kind === 'variable') return { var: node.path }
  if (node.kind === 'number' || node.kind === 'text' || node.kind === 'boolean') return node.value
  return { [node.operator]: node.args.map(serializeJsonLogic) }
}

export function cloneNode(node: LogicNode): LogicNode {
  return parseJsonLogic(serializeJsonLogic(node))
}

export function nodeResultType(node: LogicNode): LogicValueType {
  if (node.kind === 'number') return 'number'
  if (node.kind === 'text') return 'text'
  if (node.kind === 'boolean') return 'boolean'
  if (node.kind === 'variable') {
    return variableDefinitions.find((item) => item.path === node.path)?.type ?? 'any'
  }
  return operatorDefinitions.find((item) => item.value === node.operator)?.result ?? 'any'
}

export function acceptsType(expected: LogicValueType, actual: LogicValueType) {
  return expected === 'any' || actual === 'any' || expected === actual
}

export function expectedArgumentType(operator: string, index: number, parentExpected: LogicValueType): LogicValueType {
  if (['+', '-', '*', '/', '%', 'min', 'max'].includes(operator)) return 'number'
  if (['>', '>=', '<', '<='].includes(operator)) return 'number'
  if (['and', 'or', '!'].includes(operator)) return 'boolean'
  if (operator === 'if') return index === 0 ? 'boolean' : parentExpected
  if (operator === 'cat') return 'any'
  return 'any'
}
