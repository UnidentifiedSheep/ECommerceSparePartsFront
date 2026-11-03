<template>
  <div class="about-system">
    <header>
      <span class="product-name">SpareParts Admin</span>
      <h2>{{ t('settings.about.title') }}</h2>
      <p>{{ t('settings.about.tagline') }}</p>
    </header>

    <div class="unicorn-scene">
      <button type="button" class="unicorn-pet" :aria-label="t('settings.about.pet')" @click="petUnicorn">
        <span class="unicorn-stage" :class="{ 'unicorn-stage--working': wearsHelmet }" aria-hidden="true">
          <span class="stage-orbit" />
          <span class="stage-spark stage-spark--one">✦</span>
          <span class="stage-spark stage-spark--two">✧</span>
          <span class="stage-spark stage-spark--three">✦</span>
          <svg class="unicorn-shadow" viewBox="0 0 260 240"><ellipse cx="140" cy="222" rx="65" ry="8" fill="currentColor" /></svg>
          <span :key="petCount" class="unicorn-art" :class="{ 'unicorn-art--petted': petCount > 0 }">
            <svg class="unicorn" viewBox="0 0 260 240" fill="none">
              <!-- Mane, neck and face share one coordinate system with the hard hat. -->
              <path d="M163 67C200 57 217 89 205 110C227 119 222 142 210 151C234 168 230 198 211 214H157L154 88Z" fill="#b89bed" />
              <path d="M181 85C208 98 181 119 204 134C224 149 190 167 208 191" stroke="#9474ce" stroke-width="10" stroke-linecap="round" />
              <path d="M171 90C193 112 165 136 188 156C204 171 179 190 192 211" stroke="#e3a5dc" stroke-width="12" stroke-linecap="round" />
              <path d="M119 76L106 38L101 12L123 36L136 71" fill="#f5cf80" stroke="#b38b52" stroke-width="2.5" stroke-linejoin="round" />
              <path d="M106 33L119 29M110 46L126 40M115 60L131 54" stroke="#d6a75c" stroke-width="3" />
              <path d="M154 75C149 52 155 31 171 25C180 44 179 65 169 79" fill="#fff9f5" stroke="#d7cde5" stroke-width="2.5" />
              <path d="M160 63L168 39L170 63" fill="#efb6cf" />
              <path d="M120 73C138 58 163 61 176 78C188 96 181 116 170 136C163 151 177 184 201 210H113L124 165C104 166 81 157 73 145C64 133 74 119 91 107L108 88Z" fill="#fffaf6" stroke="#d7cde5" stroke-width="2.5" stroke-linejoin="round" />
              <path d="M125 165C136 166 147 157 152 145" stroke="#e5dbe9" stroke-width="3" stroke-linecap="round" />
              <path d="M91 108C96 124 87 134 73 137C72 151 95 161 112 160C125 156 129 143 124 134" fill="#f7dfec" />
              <ellipse cx="89" cy="137" rx="3" ry="4" transform="rotate(-25 89 137)" fill="#b382a2" />
              <path d="M104 147C110 149 115 148 119 144" stroke="#b382a2" stroke-width="2.5" stroke-linecap="round" />
              <ellipse cx="146" cy="125" rx="11" ry="7" fill="#f3bfd5" opacity=".65" />
              <g class="unicorn-eye"><path d="M129 106Q139 117 149 105" stroke="#514264" stroke-width="3.5" stroke-linecap="round" /><path d="M145 109L148 113" stroke="#514264" stroke-width="2.5" stroke-linecap="round" /></g>
              <path d="M126 77C140 66 158 70 167 83C155 78 151 91 140 89" fill="#e3a5dc" />
              <g v-if="wearsHelmet" class="helmet" :class="{ 'helmet--arriving': petCount === 5 }">
                <path d="M116 71C115 48 128 35 150 35C173 35 189 48 189 71Z" fill="#f4bc47" stroke="#bc852d" stroke-width="2.5" />
                <path d="M144 37V63M157 37V63" stroke="#ffe29a" stroke-width="5" stroke-linecap="round" />
                <path d="M115 66C135 61 171 62 192 69L191 77C165 70 135 71 114 77Z" fill="#ffcf65" stroke="#bc852d" stroke-width="2.5" stroke-linejoin="round" />
                <path d="M125 51C128 46 132 43 136 42" stroke="#ffe8ad" stroke-width="3" stroke-linecap="round" />
              </g>
              <path d="M115 211H200" stroke="#d7cde5" stroke-width="3" stroke-linecap="round" />
            </svg>
          </span>
          <span v-if="petCount" :key="`burst-${petCount}`" class="pet-burst">
            <span v-for="particle in 8" :key="particle" class="pet-particle" :style="{ '--particle': particle }">{{ particle % 3 === 0 ? '✦' : '♥' }}</span>
          </span>
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
.unicorn-scene { display: flex; align-items: center; gap: 28px; margin-top: 24px; }
.unicorn-pet { flex: none; display: grid; justify-items: center; gap: 8px; border: 0; border-radius: 20px; padding: 8px; background: transparent; color: var(--app-primary); font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.unicorn-pet:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 4px; }
.unicorn-stage { position: relative; display: block; isolation: isolate; width: 220px; height: 220px; }
.unicorn-stage::before { content: ''; position: absolute; inset: 22px 8px 4px; z-index: -1; border-radius: 50%; background: radial-gradient(circle at 30% 25%, #fff0e7, #f0e6fb 65%, #e3eafc); opacity: .85; transition: filter .4s; }
.unicorn-stage--working::before { filter: hue-rotate(325deg); }
.stage-orbit { position: absolute; inset: 9px 0 0; border: 1px dashed #c4b3e0; border-radius: 50%; opacity: .5; transform: rotate(-20deg) scaleY(.88); }
.unicorn-art { position: absolute; inset: 0; display: block; transform-origin: 55% 88%; animation: unicorn-breathe 4s ease-in-out infinite; }
.unicorn { display: block; width: 100%; height: 100%; overflow: visible; }
.unicorn-shadow { position: absolute; inset: 0; width: 100%; height: 100%; color: #bba2ce; opacity: .24; }
.unicorn-eye { transform-box: fill-box; transform-origin: center; animation: unicorn-blink 6s ease-in-out infinite; }
.stage-spark { position: absolute; color: #b498da; animation: sparkle 3s ease-in-out infinite; }
.stage-spark--one { top: 24px; left: 29px; font-size: 23px; }
.stage-spark--two { top: 65px; right: 0; font-size: 28px; animation-delay: -.8s; }
.stage-spark--three { bottom: 30px; left: 14px; font-size: 16px; animation-delay: -1.6s; }
.unicorn-pet:hover .stage-spark { color: #e49bbd; }
.pet-label { border: 1px solid var(--app-border-strong); border-radius: 20px; padding: 8px 20px; font-size: 13px; font-weight: 600; transition: background .2s, border-color .2s; }
.unicorn-pet:hover .pet-label { border-color: var(--app-primary); background: var(--app-primary-soft); }
.unicorn-voice { flex: 1; min-width: 0; }
.unicorn-phrase { position: relative; margin: 0; border: 1px solid var(--app-border); border-radius: 18px 18px 18px 4px; padding: 18px 20px; background: var(--app-bg-soft); font-size: 15px; line-height: 1.6; overflow-wrap: anywhere; }
.unicorn-duty { display: block; margin-top: 10px; color: var(--app-text-muted); font-size: 12px; }
.unicorn-art--petted { animation: unicorn-hop 650ms ease-out, unicorn-breathe 4s 650ms ease-in-out infinite; }
.helmet--arriving { transform-origin: 150px 70px; animation: helmet-drop 700ms cubic-bezier(.2,.8,.3,1); }
.pet-burst { position: absolute; inset: 0; pointer-events: none; }
.pet-particle { position: absolute; left: 48%; top: 40%; color: #df89b7; font-size: 18px; opacity: 0; --angle: calc(var(--particle) * 45deg); animation: pet-particle 950ms calc(var(--particle) * 25ms) ease-out both; }
.pet-particle:nth-child(even) { color: #c2a052; font-size: 14px; }
@keyframes unicorn-breathe { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-4px) rotate(1deg); } }
@keyframes unicorn-blink { 0%, 44%, 48%, 100% { transform: scaleY(1); } 46% { transform: scaleY(.15); } }
@keyframes sparkle { 0%, 100% { opacity: .35; transform: scale(.8) rotate(-8deg); } 50% { opacity: 1; transform: scale(1.15) rotate(8deg); } }
@keyframes unicorn-hop { 0%, 100% { transform: translateY(0); } 20% { transform: translateY(3px) scale(1.03,.95); } 48% { transform: translateY(-16px) rotate(-7deg); } 72% { transform: translateY(1px) rotate(3deg); } }
@keyframes helmet-drop { 0% { opacity: 0; transform: translateY(-45px) rotate(-18deg); } 55% { opacity: 1; transform: translateY(3px) rotate(3deg); } 78% { transform: translateY(-4px) rotate(-2deg); } 100% { transform: translateY(0); } }
@keyframes pet-particle { 0% { opacity: 0; transform: rotate(var(--angle)) translateX(32px) rotate(calc(-1 * var(--angle))) scale(.4); } 20% { opacity: 1; } 100% { opacity: 0; transform: rotate(var(--angle)) translateX(110px) rotate(calc(-1 * var(--angle))) translateY(-25px) scale(1.1); } }
@media (prefers-reduced-motion: reduce) { .unicorn-stage *, .unicorn-stage::before, .pet-label { animation: none !important; transition: none !important; } .pet-burst { display: none; } }
@media (max-width: 620px) { .unicorn-scene { flex-direction: column; gap: 18px; } .unicorn-voice { width: 100%; text-align: center; } .unicorn-phrase { border-radius: 18px; } }
</style>
