<template>
  <main class="login-container">
    <div class="login-shell">
      <div class="login-brand">
        <div class="brand-lockup">
          <img src="@/assets/logo.png" alt="" width="42" height="42"/>
          <span>RustDesk</span>
        </div>
        <p class="brand-title">{{ appStore.setting.title }}</p>
      </div>
      <section class="login-card" aria-labelledby="login-title">
        <h1 id="login-title">{{ T('Administrator sign-in') }}</h1>
        <p class="login-intro">{{ T('Use an administrator account to open this console.') }}</p>
        <p class="login-error" role="alert">{{ errorMessage }}</p>
        <p v-if="loading" role="status" class="login-status">{{ T('Loading sign-in options…') }}</p>

        <form v-if="!disablePwd && !loading" class="login-form" @submit.prevent="login" :aria-busy="busy">
          <label for="admin-username">{{ T('Username') }}</label>
          <input id="admin-username" v-model="form.username" name="username" autocomplete="username"
                 autocapitalize="none" spellcheck="false" required />

          <label for="admin-password">{{ T('Password') }}</label>
          <div class="password-field">
            <input id="admin-password" v-model="form.password" name="password"
                   :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required />
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              {{ T(showPassword ? 'Hide password' : 'Show password') }}
            </button>
          </div>

          <template v-if="needsCaptcha">
            <label for="admin-captcha">{{ T('Captcha') }}</label>
            <div class="captcha-field">
              <input id="admin-captcha" v-model="form.captcha" name="captcha" autocomplete="off"
                     autocapitalize="none" spellcheck="false" required />
              <button type="button" class="captcha-button" :disabled="captchaLoading"
                      :aria-label="T('Refresh') + ' ' + T('Captcha')" @click="loadCaptcha()">
                <img v-if="captchaCode" :src="captchaCode.b64" alt="" />
                <span v-else>{{ T('Refresh') }}</span>
              </button>
            </div>
          </template>
          <button type="submit" class="login-submit" :disabled="busy || (needsCaptcha && !captchaCode)">
            {{ T(busy ? 'Signing in…' : 'Login') }}
          </button>
        </form>

        <div v-if="options.length && !disablePwd" class="divider"><span>{{ T('or login in with') }}</span></div>
        <div v-if="options.length" class="oidc-options">
          <button v-for="option in options" :key="option" type="button" class="oidc-btn"
                  :disabled="busy" @click="handleOIDCLogin(option)">
            <img :src="getProviderImage(option)" alt="" width="22" height="22" />
            {{ T(option) }}
          </button>
        </div>
        <router-link v-if="allowRegister && !disablePwd" to="/register" class="register-link">
          {{ T('Register a RustDesk client account') }}
        </router-link>
      </section>
    </div>
  </main>
</template>

<script setup>
  import { reactive, onMounted, ref } from 'vue'
  import { useUserStore } from '@/store/user'
  import { useAppStore } from '@/store/app'
  import { ElMessage } from 'element-plus'
  import { T } from '@/utils/i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { loginOptions, captcha } from '@/api/login'
  import { getCode, removeCode } from '@/utils/auth'

  const userStore = useUserStore()
  const appStore = useAppStore()
  const route = useRoute()
  const router = useRouter()
  const options = ref([])
  const busy = ref(false)
  const loading = ref(true)
  const showPassword = ref(false)
  const errorMessage = ref('')
  const needsCaptcha = ref(false)
  const captchaLoading = ref(false)

  let platform = window.navigator.platform
  if (navigator.platform.indexOf('Mac') === 0) {
    platform = 'mac'
  } else if (navigator.platform.indexOf('Win') === 0) {
    platform = 'windows'
  } else if (navigator.platform.indexOf('Linux armv') === 0) {
    platform = 'android'
  } else if (navigator.platform.indexOf('Linux') === 0) {
    platform = 'linux'
  }
  const userAgent = navigator.userAgent
  let browser = 'Unknown Browser'
  if (/edg/i.test(userAgent)) browser = 'Edge'
  else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome'
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox'
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari'

  const form = reactive({
    username: '',
    password: '',
    platform: platform,
    captcha: '',
    captcha_id: ''
  })

  const captchaCode = ref(null)
  const errorText = (error) => error?.response?.data?.message || error?.response?.data?.error ||
    error?.message || T('Sign-in is unavailable. Try again.')

  const finishLogin = () => {
    const redirect = route.query.redirect
    const destination = typeof redirect === 'string' && /^\/(?![\/\\])[\S]*$/.test(redirect) ? redirect : '/'
    ElMessage.success(T('LoginSuccess'))
    return router.replace(destination)
  }

  const login = async () => {
    if (busy.value || (needsCaptcha.value && !captchaCode.value)) return
    busy.value = true
    errorMessage.value = ''
    try {
      await userStore.login(form)
      form.password = ''
      await finishLogin()
    } catch (error) {
      errorMessage.value = errorText(error)
      if (error.code === 110 || needsCaptcha.value) await loadCaptcha()
    } finally {
      busy.value = false
    }
  }

  const loadCaptcha = async () => {
    if (captchaLoading.value) return
    needsCaptcha.value = true
    captchaLoading.value = true
    captchaCode.value = null
    form.captcha = ''
    form.captcha_id = ''
    try {
      const { data } = await captcha()
      captchaCode.value = data.captcha
      form.captcha_id = data.captcha.id
    } catch (error) {
      if (error.code === 101) {
        const current = await loginOptions().catch(() => null)
        if (current?.data?.need_captcha === false) {
          needsCaptcha.value = false
          return
        }
      }
      errorMessage.value ||= errorText(error)
    } finally {
      captchaLoading.value = false
    }
  }

  const handleOIDCLogin = async (provider) => {
    if (busy.value) return
    busy.value = true
    errorMessage.value = ''
    try {
      await userStore.oidc(provider, platform, browser)
    } catch (error) {
      errorMessage.value = errorText(error)
    } finally {
      busy.value = false
    }
  }

  import googleImage from '@/assets/google.png'
  import githubImage from '@/assets/github.png'
  import oidcImage from '@/assets/oidc.png'

  const providerImageMap = {
    google: googleImage,
    github: githubImage,
    oidc: oidcImage,
  }

  const getProviderImage = (provider) => {
    const key = provider.toLowerCase()
    return Object.prototype.hasOwnProperty.call(providerImageMap, key) ? providerImageMap[key] : oidcImage
  }

  const allowRegister = ref(false)
  const disablePwd = ref(false)
  const loadLoginOptions = async (autoOIDC) => {
    try {
      const { data } = await loginOptions()
      options.value = data.ops || []
      disablePwd.value = data.disable_pwd
      allowRegister.value = data.register
      if (data.need_captcha && !data.disable_pwd) await loadCaptcha()
      if (autoOIDC && data.auto_oidc && options.value.length) await handleOIDCLogin(options.value[0])
    } catch (error) {
      errorMessage.value ||= errorText(error)
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    const denied = route.query.oidc === 'denied'
    if (denied) {
      removeCode()
      errorMessage.value = T('Only administrator accounts can sign in here.')
      await router.replace({ path: '/login', query: { redirect: route.query.redirect } })
    }
    const code = getCode()
    if (code) {
      busy.value = true
      try {
        await userStore.query(code)
        await finishLogin()
        return
      } catch (error) {
        errorMessage.value = errorText(error)
        if (error.response || error.code === 101) removeCode()
      } finally {
        busy.value = false
      }
    }
    await loadLoginOptions(!code && !denied)
  })
</script>

<style scoped lang="scss">
.login-container {
  --ink: #16263b;
  --muted: #52647a;
  --line: #c8d5e2;
  --accent: #1455a5;
  --surface: #fff;
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: clamp(16px, 4vw, 48px);
  background: radial-gradient(ellipse at 20% 15%, #e7f4ff, transparent 57%), #eef2f7;
  box-sizing: border-box;
  color: var(--ink);
}

.login-shell {
  width: min(100%, 860px);
  display: grid;
  grid-template-columns: minmax(0, .88fr) minmax(0, 1.12fr);
  border: 1px solid #d5e0ec;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 20px 70px #122e481a;
  background: var(--surface);
}

.login-brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 48px;
  padding: clamp(24px, 4.8vw, 58px);
  background: radial-gradient(ellipse at 8% 105%, #194982, transparent 75%), #102844;
  color: #fff;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.15rem;
  font-weight: 700;
}

.brand-lockup img { object-fit: contain; }
.brand-title {
  max-width: 12ch;
  margin: 0;
  font-size: clamp(1.85rem, 4vw, 3.4rem);
  line-height: 1.05;
  letter-spacing: -.025em;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.login-card { padding: clamp(24px, 5vw, 60px); }
h1 { margin: 0; font-size: clamp(1.55rem, 3.2vw, 2.2rem); letter-spacing: -.025em; }
.login-intro, .login-status { margin: 12px 0 24px; color: var(--muted); line-height: 1.5; }
.login-error { color: #a0262f; font-weight: 600; line-height: 1.45; }
.login-error:empty { margin: 0; }
.login-form { display: grid; gap: 8px; }
.login-form label { margin-top: 8px; font-size: .9rem; font-weight: 650; }
.login-form input {
  min-width: 0;
  width: 100%;
  min-height: 46px;
  box-sizing: border-box;
  padding: 0 12px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 1rem;
}
.password-field, .captcha-field {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
}
.login-container :is(button, input, a):focus-visible {
  outline: 3px solid #2e75c9;
  outline-offset: 2px;
}
.login-container button {
  min-height: 44px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--accent);
  padding: 6px 12px;
  font-weight: 650;
  cursor: pointer;
}
.login-container button:not(:disabled):hover { border-color: var(--accent); }
.login-container button:disabled { opacity: .62; cursor: default; }
.captcha-button img { display: block; width: 100px; height: auto; }
.login-container .login-submit {
  margin-top: 12px;
  min-height: 48px;
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.login-container .login-submit:not(:disabled):hover { background: #104783; }
.divider { display: flex; align-items: center; gap: 12px; margin: 24px 0 12px; color: var(--muted); font-size: .88rem; }
.divider::before, .divider::after { content: ''; height: 1px; flex: 1; background: var(--line); }
.oidc-options { display: grid; gap: 8px; }
.oidc-btn { display: flex; align-items: center; justify-content: center; gap: 10px; }
.oidc-btn img { object-fit: contain; }
.register-link { display: inline-block; margin-top: 22px; color: var(--accent); font-size: .9rem; text-underline-offset: .2em; }

:global(html.dark) .login-container {
  --surface: #172436;
  --ink: #f0f6ff;
  --muted: #b4c5da;
  --line: #536a84;
  --accent: #aacfff;
  background: #0c1522;
}
:global(html.dark) .login-shell { border-color: var(--line); }
:global(html.dark) .login-error { color: #ffb6b9; }
:global(html.dark) .login-container .login-submit { background: #1757a4; border-color: #719ce1; }

@media (max-width: 640px) {
  .login-shell { grid-template-columns: minmax(0, 1fr); }
  .login-brand { gap: 14px; }
  .brand-title { max-width: none; font-size: 1.3rem; letter-spacing: 0; }
}
</style>
