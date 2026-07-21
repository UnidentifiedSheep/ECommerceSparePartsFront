<template>
  <div
    class="logic-node"
    :class="[
      { 'logic-node--root': root, 'logic-node--selected': selectedNodeId === modelValue.id },
    ]"
    :style="nodeStyle"
    @click.stop="emit('select', modelValue.id)"
    @dragover.stop.prevent
    @drop.stop="handleDrop"
  >
    <div class="logic-node__controls">
      <button
        v-if="modelValue.kind === 'operation'"
        type="button"
        class="collapse-button"
        :aria-label="t(collapsed ? 'priceAppliers.builder.expand' : 'priceAppliers.builder.collapse')"
        @click.stop="toggleCollapsed"
      >
        <el-icon><ArrowRight v-if="collapsed" /><ArrowDown v-else /></el-icon>
      </button>

      <div v-else class="logic-node__kind">{{ nodeKindLabel }}</div>

      <el-select
        v-if="modelValue.kind === 'variable'"
        :model-value="modelValue.path"
        filterable
        allow-create
        class="value-control"
        @change="updateVariable"
      >
        <el-option
          v-for="variable in availableVariables"
          :key="variable.path"
          :label="t(`priceAppliers.builder.variables.${variable.path}`)"
          :value="variable.path"
        />
      </el-select>

      <el-input-number
        v-else-if="modelValue.kind === 'number'"
        :model-value="modelValue.value"
        :controls="false"
        class="value-control"
        @update:model-value="updateNumber"
      />

      <el-input
        v-else-if="modelValue.kind === 'text'"
        :model-value="modelValue.value"
        class="value-control"
        @update:model-value="updateText"
      />

      <el-select
        v-else-if="modelValue.kind === 'boolean'"
        :model-value="modelValue.value"
        class="value-control"
        @change="updateBoolean"
      >
        <el-option :label="t('priceAppliers.builder.true')" :value="true" />
        <el-option :label="t('priceAppliers.builder.false')" :value="false" />
      </el-select>

      <el-select
        v-else
        :model-value="modelValue.operator"
        class="value-control"
        @change="changeOperator"
      >
        <el-option
          v-if="!knownOperator"
          :label="modelValue.kind === 'operation' ? modelValue.operator : ''"
          :value="modelValue.kind === 'operation' ? modelValue.operator : ''"
        />
        <el-option-group
          v-for="group in operatorGroups"
          :key="group"
          :label="t(`priceAppliers.builder.groups.${group}`)"
        >
          <el-option
            v-for="operator in operatorsByGroup(group)"
            :key="operator.value"
            :label="t(`priceAppliers.builder.operators.${operator.value}`)"
            :value="operator.value"
          />
        </el-option-group>
      </el-select>

      <el-button
        v-if="removable"
        text
        type="danger"
        :aria-label="t('common.actions.delete')"
        @click="emit('remove')"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>

    <div v-if="modelValue.kind === 'operation' && collapsed" class="logic-node__collapsed">
      {{ collapsedSummary }}
    </div>

    <div v-if="modelValue.kind === 'operation'" v-show="!collapsed" class="logic-node__arguments">
      <div v-for="(argument, index) in modelValue.args" :key="argument.id" class="logic-argument">
        <div class="logic-argument__label">{{ argumentLabel(modelValue.operator, index) }}</div>
        <JsonLogicExpressionEditor
          :model-value="argument"
          :expected-type="argumentType(modelValue.operator, index)"
          :removable="canRemoveArgument"
          :selected-node-id="selectedNodeId"
          @update:model-value="updateArgument(index, $event)"
          @remove="removeArgument(index)"
          @select="emit('select', $event)"
        />
      </div>

      <el-button
        v-if="canAddArgument"
        plain
        size="small"
        class="add-argument"
        @click="addArgument"
      >
        <el-icon><Plus /></el-icon>
        {{ t('priceAppliers.builder.addArgument') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowRight, Delete, Plus } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'
import {
  createNode,
  acceptsType,
  expectedArgumentType,
  nodeResultType,
  operatorDefinitions,
  parseJsonLogic,
  variableDefinitions,
  type LogicNode,
  type LogicValueType,
  type OperatorDefinition,
} from '@/components/pricing/jsonLogicBuilder.ts'

const props = withDefaults(defineProps<{
  modelValue: LogicNode
  root?: boolean
  removable?: boolean
  expectedType?: LogicValueType
  selectedNodeId?: string | null
}>(), {
  root: false,
  removable: false,
  expectedType: 'any',
  selectedNodeId: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: LogicNode]
  remove: []
  select: [nodeId: string]
}>()

const { locale, t } = useI18n()
const collapsed = ref(false)
const operatorGroups: OperatorDefinition['group'][] = ['arithmetic', 'comparison', 'logic', 'control', 'text']
const definition = computed(() => {
  const node = props.modelValue
  return node.kind === 'operation'
    ? operatorDefinitions.find((item) => item.value === node.operator)
    : undefined
})
const knownOperator = computed(() => Boolean(definition.value))
const canAddArgument = computed(() => props.modelValue.kind === 'operation'
  && props.modelValue.args.length < (definition.value?.maxArgs ?? 8))
const canRemoveArgument = computed(() => props.modelValue.kind === 'operation'
  && props.modelValue.args.length > (definition.value?.minArgs ?? 1))
const availableVariables = computed(() => variableDefinitions.filter((variable) => acceptsType(props.expectedType, variable.type)))
const availableOperators = computed(() => operatorDefinitions.filter((operator) => acceptsType(props.expectedType, operator.result)))
const nodeKindLabel = computed(() => t(`priceAppliers.builder.${props.modelValue.kind}`))
const nodeStyle = computed(() => {
  const [color, background] = nodeColors(props.modelValue)
  return {
    '--logic-node-color': color,
    '--logic-node-background': background,
  }
})
const collapsedSummary = computed(() => summarizeNode(props.modelValue))

function operatorsByGroup(group: OperatorDefinition['group']) {
  return availableOperators.value.filter((operator) => operator.group === group)
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  emit('select', props.modelValue.id)
}

function updateVariable(path: string) {
  if (props.modelValue.kind !== 'variable') return
  emit('update:modelValue', { ...props.modelValue, path })
}

function updateNumber(value: number | undefined) {
  if (props.modelValue.kind !== 'number') return
  emit('update:modelValue', { ...props.modelValue, value: value ?? 0 })
}

function updateText(value: string) {
  if (props.modelValue.kind !== 'text') return
  emit('update:modelValue', { ...props.modelValue, value })
}

function updateBoolean(value: boolean) {
  if (props.modelValue.kind !== 'boolean') return
  emit('update:modelValue', { ...props.modelValue, value })
}

function changeOperator(operator: string) {
  if (props.modelValue.kind !== 'operation') return
  const nextDefinition = operatorDefinitions.find((item) => item.value === operator)
  const targetCount = nextDefinition?.minArgs ?? 2
  const args = props.modelValue.args
    .slice(0, nextDefinition?.maxArgs ?? 8)
    .map((argument, index) => {
      const expected = expectedArgumentType(operator, index, props.expectedType)
      return acceptsType(expected, nodeResultType(argument))
        ? argument
        : createCompatibleNode('variable', expected)
    })
  while (args.length < targetCount) args.push(createCompatibleNode('variable', expectedArgumentType(operator, args.length, props.expectedType)))
  emit('update:modelValue', { ...props.modelValue, operator, args })
}

function updateArgument(index: number, argument: LogicNode) {
  if (props.modelValue.kind !== 'operation') return
  const args = [...props.modelValue.args]
  args[index] = argument
  emit('update:modelValue', { ...props.modelValue, args })
}

function addArgument() {
  if (props.modelValue.kind !== 'operation' || !canAddArgument.value) return
  const type = expectedArgumentType(props.modelValue.operator, props.modelValue.args.length, props.expectedType)
  emit('update:modelValue', { ...props.modelValue, args: [...props.modelValue.args, createCompatibleNode('variable', type)] })
}

function removeArgument(index: number) {
  if (props.modelValue.kind !== 'operation') return
  if (props.modelValue.args.length <= (definition.value?.minArgs ?? 1)) return
  emit('update:modelValue', {
    ...props.modelValue,
    args: props.modelValue.args.filter((_, argumentIndex) => argumentIndex !== index),
  })
}

function argumentLabel(operator: string, index: number) {
  if (operator === 'if') return t(`priceAppliers.builder.ifArguments.${index}`)
  if (['==', '!=', '>', '>=', '<', '<=', 'in'].includes(operator)) {
    return t(`priceAppliers.builder.binaryArguments.${index}`)
  }
  return t('priceAppliers.builder.argument', { index: index + 1 })
}

function argumentType(operator: string, index: number) {
  return expectedArgumentType(operator, index, props.expectedType)
}

function createCompatibleNode(kind: LogicNode['kind'], expected: LogicValueType): LogicNode {
  if (kind === 'operation') {
    const operator = expected === 'boolean' ? '>' : expected === 'text' ? 'cat' : '*'
    const node = createNode('operation')
    node.operator = operator
    node.args = []
    const count = operatorDefinitions.find((item) => item.value === operator)?.minArgs ?? 2
    while (node.args.length < count) {
      node.args.push(createCompatibleNode('variable', expectedArgumentType(operator, node.args.length, expected)))
    }
    return node
  }
  if (kind === 'variable') {
    const variable = variableDefinitions.find((item) => acceptsType(expected, item.type))
    return { ...createNode('variable'), path: variable?.path ?? 'salePrice' }
  }
  return createNode(kind)
}

function handleDrop(event: DragEvent) {
  const raw = event.dataTransfer?.getData('application/x-jsonlogic')
  if (!raw) return
  try {
    const node = parseJsonLogic(JSON.parse(raw))
    if (acceptsType(props.expectedType, nodeResultType(node))) {
      emit('update:modelValue', node)
      emit('select', node.id)
    }
  } catch {
    // Ignore malformed drag payloads from outside the builder.
  }
}

function nodeColors(node: LogicNode): [string, string] {
  if (node.kind === 'variable') return ['#475569', '#f8fafc']
  if (node.kind === 'number') return ['#78716c', '#fafaf9']
  if (node.kind === 'text') return ['#596b3f', '#f7fee7']
  if (node.kind === 'boolean') return ['#7c3f58', '#fdf2f8']

  const tones: Record<string, [string, string]> = {
    '+': ['#047857', '#ecfdf5'],
    '-': ['#0f766e', '#f0fdfa'],
    '*': ['#15803d', '#f0fdf4'],
    '/': ['#4d7c0f', '#f7fee7'],
    '%': ['#657a2e', '#f7fee7'],
    min: ['#3f6212', '#f7fee7'],
    max: ['#166534', '#f0fdf4'],
    '==': ['#a16207', '#fffbeb'],
    '!=': ['#b45309', '#fff7ed'],
    '>': ['#92400e', '#fffbeb'],
    '>=': ['#9a3412', '#fff7ed'],
    '<': ['#854d0e', '#fefce8'],
    '<=': ['#78350f', '#fff7ed'],
    and: ['#7c3f58', '#fdf2f8'],
    or: ['#6b3f70', '#faf5ff'],
    '!': ['#5b3a66', '#faf5ff'],
    if: ['#9a4b2f', '#fff7ed'],
    cat: ['#596b3f', '#f7fee7'],
    in: ['#6b5d2f', '#fefce8'],
  }
  return tones[node.operator] ?? ['#64748b', '#f8fafc']
}

function summarizeNode(node: LogicNode): string {
  if (node.kind === 'variable') return t(`priceAppliers.builder.variables.${node.path}`)
  if (node.kind === 'number') return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 4 }).format(node.value)
  if (node.kind === 'text') return `“${node.value}”`
  if (node.kind === 'boolean') return t(node.value ? 'priceAppliers.builder.true' : 'priceAppliers.builder.false')

  const args = node.args.map(summarizeNode)
  if (node.operator === 'if') return `IF(${args.join(', ')})`
  if (node.operator === 'min' || node.operator === 'max') return `${node.operator.toUpperCase()}(${args.join(', ')})`
  if (node.operator === 'and' || node.operator === 'or') return `(${args.join(` ${node.operator.toUpperCase()} `)})`
  if (node.operator === '!') return `NOT(${args[0] ?? ''})`
  return `(${args.join(` ${node.operator} `)})`
}
</script>

<style scoped>
.logic-node {
  border: 1px solid var(--app-border);
  border-left: 4px solid var(--logic-node-color);
  border-radius: 6px;
  background: var(--logic-node-background);
  padding: 8px;
}

.logic-node--root {
  padding: 10px;
}

.logic-node--selected {
  outline: 2px solid var(--app-primary);
  outline-offset: 2px;
}

.logic-node__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logic-node__kind {
  width: 68px;
  flex: 0 0 auto;
  color: var(--logic-node-color);
  font-size: 12px;
  font-weight: 700;
}

.value-control {
  width: 100%;
  min-width: 150px;
}

.logic-node__arguments {
  position: relative;
  display: grid;
  gap: 10px;
  margin-top: 10px;
  margin-left: 10px;
  border-left: 1px solid color-mix(in srgb, var(--logic-node-color) 45%, transparent);
  padding-left: 18px;
}

.logic-argument {
  position: relative;
  display: grid;
  gap: 5px;
}

.logic-argument::before {
  position: absolute;
  top: 15px;
  left: -18px;
  width: 12px;
  border-top: 1px solid color-mix(in srgb, var(--logic-node-color) 45%, transparent);
  content: '';
}

.logic-argument__label {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.add-argument {
  justify-self: start;
}

.collapse-button {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--logic-node-color);
  cursor: pointer;
}

.collapse-button:hover {
  background: rgba(15, 23, 42, 0.06);
}

.logic-node__collapsed {
  overflow: hidden;
  margin: 6px 0 0 32px;
  color: var(--app-text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 620px) {
  .logic-node__controls {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .value-control {
    width: 100%;
  }
}
</style>
