<template>
  <main class="auth-shell">
    <div class="auth-shell__language">
      <LocaleSwitcher variant="light" />
    </div>

    <section class="auth-shell__brand" aria-label="Application">
      <div class="auth-shell__brand-content">
        <img class="auth-shell__logo" src="/iconv3-clean.png" alt="" />
        <div>
          <div class="auth-shell__name">{{ t('app.name') }}</div>
          <p class="auth-shell__subtitle">{{ t('app.subtitle') }}</p>
        </div>
      </div>
    </section>

    <section class="auth-shell__content">
      <div class="auth-shell__panel">
        <slot />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>

<style>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 42%) minmax(360px, 58%);
  background: #f8fafc;
  color: #0f172a;
}

.auth-shell__language {
  position: fixed;
  top: 20px;
  right: 22px;
  z-index: 10;
}

.auth-shell__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #ffffff;
  border-right: 1px solid #dbe3ef;
}

.auth-shell__brand-content {
  width: 100%;
  max-width: 420px;
}

.auth-shell__logo {
  width: 58px;
  height: 58px;
  display: block;
  margin-bottom: 28px;
  border-radius: 12px;
}

.auth-shell__name {
  margin: 0;
  font-size: 40px;
  line-height: 1.05;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #07142b;
}

.auth-shell__subtitle {
  margin: 12px 0 0;
  max-width: 320px;
  font-size: 15px;
  line-height: 1.6;
  color: #64748b;
}

.auth-shell__content {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px 40px;
}

.auth-shell__panel {
  width: 100%;
  max-width: 432px;
  padding: 30px;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
}

.auth-form__header {
  margin-bottom: 28px;
}

.auth-form__header h2,
.auth-form__header h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  color: #07142b;
}

.auth-form__header p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.auth-form {
  display: grid;
  gap: 18px;
}

.auth-field {
  display: grid;
  gap: 8px;
}

.auth-field__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.auth-field__label {
  font-size: 13px;
  line-height: 1.35;
  font-weight: 650;
  color: #26364f;
}

.auth-form .el-input__wrapper {
  min-height: 40px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #cfd8e5 inset;
}

.auth-form .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #aab7ca inset;
}

.auth-form .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #1d4ed8 inset, 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.auth-form__link {
  color: #31517c;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 650;
  text-decoration: none;
}

.auth-form__link:hover {
  color: #0f172a;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-form__actions {
  display: grid;
  gap: 14px;
  padding-top: 6px;
}

.auth-form__submit {
  width: 100%;
}

.auth-form__secondary-action {
  text-align: center;
}

.auth-form__message {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #dc2626;
}

.auth-form .el-alert {
  border-radius: 8px;
}

@media (max-width: 900px) {
  .auth-shell {
    display: block;
  }

  .auth-shell__brand {
    min-height: auto;
    justify-content: flex-start;
    padding: 30px 20px 22px;
    border-right: 0;
    border-bottom: 1px solid #dbe3ef;
  }

  .auth-shell__brand-content {
    display: flex;
    align-items: center;
    gap: 14px;
    max-width: none;
  }

  .auth-shell__logo {
    width: 40px;
    height: 40px;
    margin: 0;
    border-radius: 9px;
  }

  .auth-shell__name {
    font-size: 22px;
  }

  .auth-shell__subtitle {
    margin-top: 2px;
    font-size: 13px;
  }

  .auth-shell__content {
    padding: 28px 16px 24px;
  }

  .auth-shell__panel {
    max-width: none;
    padding: 24px;
  }

  .auth-shell__language {
    top: 18px;
    right: 16px;
  }
}

@media (max-width: 520px) {
  .auth-shell__brand {
    padding-right: 120px;
  }

  .auth-shell__panel {
    padding: 20px;
  }

  .auth-form__header {
    margin-bottom: 22px;
  }
}
</style>
