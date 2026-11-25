import { describe, expect, it } from 'vitest'
import { obsoleteDeliveryVariables, parseJsonLogic, serializeJsonLogic } from './jsonLogicBuilder'

describe('delivery variables in pricing rules', () => {
  it('lists distinct obsolete references inside conditions without rewriting the rule', () => {
    const legacy = { var: 'candidate.fulfillment.deliveryTime' }
    const rule = {
      if: [
        { '==': [legacy, '1.00:00:00'] },
        { '+': [legacy, { var: 'candidate.fulfillment.logisticsCostInBaseCurrency' }] },
        { var: 'candidate.deliveryDays' },
      ],
    }
    const root = parseJsonLogic(rule)
    expect(obsoleteDeliveryVariables(root)).toEqual([
      'candidate.fulfillment.deliveryTime',
      'candidate.fulfillment.logisticsCostInBaseCurrency',
    ])
    expect(serializeJsonLogic(root)).toEqual(rule)
  })

  it('accepts rules that use the new delivery variables', () => {
    expect(obsoleteDeliveryVariables(parseJsonLogic({
      max: [{ var: 'candidate.deliveryDays' }, { var: 'candidate.guaranteedDeliveryDays' }],
    }))).toEqual([])
  })
})
