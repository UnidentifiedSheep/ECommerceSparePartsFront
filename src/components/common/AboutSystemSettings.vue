<template>
  <div class="about-system">
    <header>
      <span class="product-name">SpareParts Admin</span>
      <h2>{{ t('settings.about.title') }}</h2>
      <p>{{ t('settings.about.tagline') }}</p>
    </header>

    <div class="unicorn-scene">
      <button type="button" class="unicorn-pet" :aria-label="t('settings.about.pet')" @click="petUnicorn">
        <span :key="petCount" class="unicorn-art" :class="{ 'unicorn-art--petted': petCount > 0 }" aria-hidden="true">
          <span class="unicorn">🦄</span>
          <span v-if="wearsHelmet" class="helmet">🪖</span>
        </span>
        <span class="pet-label">{{ t('settings.about.pet') }}</span>
      </button>

      <div class="unicorn-voice">
        <p class="unicorn-phrase" role="status" aria-live="polite" aria-atomic="true">{{ t(phraseKey) }}</p>
        <span v-if="wearsHelmet" class="unicorn-duty">{{ t('settings.about.foreman') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const petCount = ref(0)
const wearsHelmet = computed(() => petCount.value >= 5)
const phraseKey = ref('settings.about.greeting')
const phrases = ['settings.about.stock', 'settings.about.cross', 'settings.about.currency', 'settings.about.request']

function petUnicorn() {
  petCount.value += 1
  if (petCount.value === 5) {
    phraseKey.value = 'settings.about.helmet'
    return
  }
  const choices = phrases.filter(phrase => phrase !== phraseKey.value)
  phraseKey.value = choices[Math.floor(Math.random() * choices.length)]!
}
</script>

<style scoped>
.about-system { max-width: 620px; color: var(--app-text); }
.product-name { font-size: 12px; color: var(--app-text-muted); }
h2 { margin: 4px 0 8px; font-size: 21px; font-weight: 650; }
header > p { margin: 0; color: var(--app-text-muted); font-size: 14px; line-height: 1.6; max-width: 460px; }
.unicorn-scene { display: flex; align-items: center; gap: 24px; margin-top: 24px; }
.unicorn-pet { flex: none; display: grid; justify-items: center; gap: 10px; border: 0; border-radius: 12px; padding: 10px; background: transparent; color: var(--app-primary); font: inherit; cursor: pointer; }
.unicorn-pet:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 4px; }
.unicorn-art { position: relative; display: grid; place-items: center; width: 112px; height: 116px; }
.unicorn { font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; font-size: 80px; line-height: 1; }
.helmet { position: absolute; top: 0; left: 42px; font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; font-size: 36px; line-height: 1; transform: rotate(-12deg); }
.pet-label { border: 1px solid var(--app-border-strong); border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 600; }
.unicorn-pet:hover .pet-label { border-color: var(--app-primary); background: var(--app-primary-soft); }
.unicorn-voice { flex: 1; min-width: 0; }
.unicorn-phrase { margin: 0; border: 1px solid var(--app-border); border-radius: 12px; padding: 18px; background: var(--app-bg-soft); font-size: 15px; line-height: 1.6; overflow-wrap: anywhere; }
.unicorn-duty { display: block; margin-top: 10px; color: var(--app-text-muted); font-size: 12px; }
.unicorn-art--petted { animation: unicorn-nod 360ms ease-out; }
@keyframes unicorn-nod { 0%, 100% { transform: rotate(0); } 35% { transform: rotate(-8deg) translateY(-5px); } 70% { transform: rotate(5deg); } }
@media (prefers-reduced-motion: reduce) { .unicorn-art--petted { animation: none; } }
@media (max-width: 540px) { .unicorn-scene { flex-direction: column; gap: 18px; } .unicorn-voice { width: 100%; text-align: center; } }
</style>
