<template>
  <div class="builder-shell">
    <section class="formula-preview">
      <div class="formula-preview__label">{{ t('priceAppliers.builder.formulaPreview') }}</div>
      <code :title="humanFormula">{{ humanFormula }}</code>
    </section>

    <div class="logic-builder">
    <aside class="block-palette">
      <div class="palette-header">{{ t('priceAppliers.builder.palette') }}</div>
      <div ref="paletteScroll" class="palette-scroll">
        <el-input
          v-model="variableSearch"
          clearable
          size="small"
          :placeholder="t('priceAppliers.builder.searchData')"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <section class="palette-section">
          <div class="palette-section__title">{{ t('priceAppliers.builder.groups.constants') }}</div>
          <button
            type="button"
            class="palette-block palette-block--number"
            draggable="true"
            @dragstart="startPaletteDrag($event, 0)"
            @click="insertSelected(0)"
          >
            {{ t('priceAppliers.builder.number') }}
          </button>
          <button
            type="button"
            class="palette-block palette-block--text"
            draggable="true"
            @dragstart="startPaletteDrag($event, '')"
            @click="insertSelected('')"
          >
            {{ t('priceAppliers.builder.text') }}
          </button>
          <button
            type="button"
            class="palette-block palette-block--boolean"
            draggable="true"
            @dragstart="startPaletteDrag($event, true)"
            @click="insertSelected(true)"
          >
            {{ t('priceAppliers.builder.boolean') }}
          </button>
        </section>

        <section class="palette-section">
          <div class="palette-section__title">{{ t('priceAppliers.builder.groups.data') }}</div>
          <button
            v-for="variable in filteredVariables"
            :key="variable.path"
            type="button"
            class="palette-block palette-block--data"
            draggable="true"
            @dragstart="startPaletteDrag($event, { var: variable.path })"
            @click="insertSelected({ var: variable.path })"
          >
            {{ t(`priceAppliers.builder.variables.${variable.path}`) }}
          </button>
        </section>

        <section class="palette-section">
          <div class="palette-section__title">{{ t('priceAppliers.builder.groups.arithmetic') }}</div>
          <button
            v-for="operator in arithmeticOperators"
            :key="operator"
            type="button"
            class="palette-block palette-block--arithmetic"
            :style="paletteStyle(operator)"
            draggable="true"
            @dragstart="startPaletteDrag($event, operationTemplate(operator))"
            @click="insertSelected(operationTemplate(operator))"
          >
            {{ t(`priceAppliers.builder.operators.${operator}`) }}
          </button>
        </section>

        <section class="palette-section">
          <div class="palette-section__title">{{ t('priceAppliers.builder.groups.comparison') }}</div>
          <button
            v-for="operator in comparisonOperators"
            :key="operator"
            type="button"
            class="palette-block palette-block--comparison"
            :style="paletteStyle(operator)"
            draggable="true"
            @dragstart="startPaletteDrag($event, operationTemplate(operator))"
            @click="insertSelected(operationTemplate(operator))"
          >
            {{ t(`priceAppliers.builder.operators.${operator}`) }}
          </button>
        </section>

        <section class="palette-section">
          <div class="palette-section__title">{{ t('priceAppliers.builder.groups.logic') }}</div>
          <button
            v-for="operator in logicOperators"
            :key="operator"
            type="button"
            class="palette-block palette-block--logic"
            :style="paletteStyle(operator)"
            draggable="true"
            @dragstart="startPaletteDrag($event, operationTemplate(operator))"
            @click="insertSelected(operationTemplate(operator))"
          >
            {{ t(`priceAppliers.builder.operators.${operator}`) }}
          </button>
        </section>

        <section class="palette-section">
          <div class="palette-section__title">{{ t('priceAppliers.builder.groups.control') }}</div>
          <button
            type="button"
            class="palette-block palette-block--control"
            :style="paletteStyle('if')"
            draggable="true"
            @dragstart="startPaletteDrag($event, operationTemplate('if'))"
            @click="insertSelected(operationTemplate('if'))"
          >
            {{ t('priceAppliers.builder.operators.if') }}
          </button>
        </section>
      </div>
    </aside>

    <section class="formula-canvas">
      <div class="canvas-header">
        <span>{{ t('priceAppliers.builder.canvas') }}</span>
        <span>{{ t('priceAppliers.builder.outputDecimal') }}</span>
      </div>
      <div class="canvas-body">
        <JsonLogicExpressionEditor
          :model-value="modelValue"
          expected-type="number"
          :selected-node-id="selectedNodeId"
          root
          @update:model-value="updateRoot"
          @select="selectedNodeId = $event"
        />
        <p>{{ t('priceAppliers.builder.selectionHint') }}</p>
      </div>
    </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'
import JsonLogicExpressionEditor from '@/components/pricing/JsonLogicExpressionEditor.vue'
import {
  acceptsType,
  expectedArgumentType,
  nodeResultType,
  parseJsonLogic,
  variableDefinitions,
  type JsonLogicValue,
  type LogicNode,
} from '@/components/pricing/jsonLogicBuilder.ts'

const props = defineProps<{ modelValue: LogicNode }>()

const emit = defineEmits<{
  'update:modelValue': [value: LogicNode]
}>()

const { locale, t } = useI18n()
const arithmeticOperators = ['+', '-', '*', '/', '%', 'min', 'max'] as const
const comparisonOperators = ['==', '!=', '>', '>=', '<', '<='] as const
const logicOperators = ['and', 'or', '!'] as const
const variableSearch = ref('')
const paletteScroll = ref<HTMLElement | null>(null)
const selectedNodeId = ref(props.modelValue.id)
const filteredVariables = computed(() => {
  const query = variableSearch.value.trim().toLocaleLowerCase()
  if (!query) return variableDefinitions
  return variableDefinitions.filter((variable) => {
    const label = t(`priceAppliers.builder.variables.${variable.path}`).toLocaleLowerCase()
    return variable.path.toLocaleLowerCase().includes(query) || label.includes(query)
  })
})
const humanFormula = computed(() => formatFormula(props.modelValue))

watch(
  () => props.modelValue,
  (root) => {
    if (!findNode(root, selectedNodeId.value)) selectedNodeId.value = root.id
  },
  { deep: true },
)

watch(variableSearch, () => paletteScroll.value?.scrollTo({ top: 0 }))

function operationTemplate(operator: string): JsonLogicValue {
  if (operator === 'if') {
    return { if: [{ '>': [{ var: 'market.offerCount' }, 0] }, { var: 'salePrice' }, { var: 'cost' }] }
  }
  if (operator === '!') return { '!': [{ var: 'market.hasMarket' }] }
  if (operator === 'and' || operator === 'or') {
    return { [operator]: [{ var: 'market.hasMarket' }, { '>': [{ var: 'market.offerCount' }, 0] }] }
  }
  if (comparisonOperators.includes(operator as typeof comparisonOperators[number])) {
    return { [operator]: [{ var: 'salePrice' }, { var: 'cost' }] }
  }
  return { [operator]: [{ var: 'salePrice' }, 1] }
}

function startPaletteDrag(event: DragEvent, value: JsonLogicValue) {
  event.dataTransfer?.setData('application/x-jsonlogic', JSON.stringify(value))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}

function insertSelected(value: JsonLogicValue) {
  const node = parseJsonLogic(value)
  const expected = findExpectedType(props.modelValue, selectedNodeId.value, 'number')
  if (!expected || !acceptsType(expected, nodeResultType(node))) {
    ElMessage.warning(t('priceAppliers.builder.blockTypeMismatch'))
    return
  }
  emit('update:modelValue', replaceNode(props.modelValue, selectedNodeId.value, node))
  selectedNodeId.value = node.id
}

function updateRoot(root: LogicNode) {
  emit('update:modelValue', root)
}

function findNode(node: LogicNode, id: string): LogicNode | null {
  if (node.id === id) return node
  if (node.kind !== 'operation') return null
  for (const argument of node.args) {
    const found = findNode(argument, id)
    if (found) return found
  }
  return null
}

function findExpectedType(
  node: LogicNode,
  id: string,
  expected: 'number' | 'boolean' | 'text' | 'any',
): 'number' | 'boolean' | 'text' | 'any' | null {
  if (node.id === id) return expected
  if (node.kind !== 'operation') return null
  for (let index = 0; index < node.args.length; index++) {
    const argument = node.args[index]!
    const argumentExpected = expectedArgumentType(node.operator, index, expected)
    const found = findExpectedType(argument, id, argumentExpected)
    if (found) return found
  }
  return null
}

function replaceNode(node: LogicNode, id: string, replacement: LogicNode): LogicNode {
  if (node.id === id) return replacement
  if (node.kind !== 'operation') return node
  return {
    ...node,
    args: node.args.map((argument) => replaceNode(argument, id, replacement)),
  }
}

function formatFormula(node: LogicNode): string {
  if (node.kind === 'variable') return t(`priceAppliers.builder.variables.${node.path}`)
  if (node.kind === 'number') return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 6 }).format(node.value)
  if (node.kind === 'text') return `“${node.value}”`
  if (node.kind === 'boolean') return t(node.value ? 'priceAppliers.builder.true' : 'priceAppliers.builder.false')

  const args = node.args.map(formatFormula)
  if (node.operator === 'if') return `IF(${args.join(', ')})`
  if (node.operator === 'min' || node.operator === 'max') return `${node.operator.toUpperCase()}(${args.join(', ')})`
  if (node.operator === 'and' || node.operator === 'or') return `(${args.join(` ${node.operator.toUpperCase()} `)})`
  if (node.operator === '!') return `NOT(${args[0] ?? ''})`
  if (node.operator === 'cat' || node.operator === 'in') return `${node.operator.toUpperCase()}(${args.join(', ')})`
  return `(${args.join(` ${node.operator} `)})`
}

function paletteStyle(operator: string) {
  const colors: Record<string, string> = {
    '+': '#047857',
    '-': '#0f766e',
    '*': '#15803d',
    '/': '#4d7c0f',
    '%': '#657a2e',
    min: '#3f6212',
    max: '#166534',
    '==': '#a16207',
    '!=': '#b45309',
    '>': '#92400e',
    '>=': '#9a3412',
    '<': '#854d0e',
    '<=': '#78350f',
    and: '#7c3f58',
    or: '#6b3f70',
    '!': '#5b3a66',
    if: '#9a4b2f',
  }
  return { '--palette-color': colors[operator] ?? '#64748b' }
}
</script>

<style scoped>
.builder-shell {
  display: grid;
  width: 100%;
  gap: 10px;
}

.formula-preview {
  min-width: 0;
  border: 1px solid var(--app-border);
  border-radius: 7px;
  background: #ffffff;
  padding: 9px 11px;
}

.formula-preview__label {
  margin-bottom: 3px;
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.formula-preview code {
  display: block;
  overflow: hidden;
  color: var(--app-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logic-builder {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  min-height: 430px;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: #ffffff;
}

.block-palette {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  border-right: 1px solid var(--app-border);
  background: #f8fafc;
}

.palette-header,
.canvas-header {
  border-bottom: 1px solid var(--app-border);
  padding: 9px 11px;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 700;
}

.palette-scroll {
  display: grid;
  align-content: start;
  gap: 14px;
  max-height: 520px;
  overflow: auto;
  padding: 10px;
}

.palette-scroll > .el-input {
  position: sticky;
  z-index: 1;
  top: 0;
}

.palette-section {
  display: grid;
  gap: 5px;
}

.palette-section__title {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.palette-block {
  width: 100%;
  border: 1px solid var(--app-border);
  border-left: 4px solid var(--palette-color, #64748b);
  border-radius: 6px;
  background: #ffffff;
  padding: 6px 8px;
  color: #334155;
  font: inherit;
  font-size: 12px;
  line-height: 1.3;
  text-align: left;
  cursor: grab;
}

.palette-block:hover {
  border-color: var(--app-border-strong);
  background: #fdfefd;
}

.palette-block--data { border-left-color: #475569; }
.palette-block--number { --palette-color: #78716c; }
.palette-block--text { --palette-color: #596b3f; }
.palette-block--boolean { --palette-color: #7c3f58; }

.formula-canvas {
  min-width: 0;
  background: #ffffff;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.canvas-header span:last-child {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.canvas-body {
  padding: 14px;
}

.canvas-body > p {
  margin: 10px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 400;
}

@media (max-width: 720px) {
  .logic-builder {
    grid-template-columns: 1fr;
  }

  .block-palette {
    border-right: 0;
    border-bottom: 1px solid var(--app-border);
  }

  .palette-scroll {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: 260px;
  }
}
</style>
