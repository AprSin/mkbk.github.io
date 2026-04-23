import { useUserStore } from './store/modules/user'

export default {
  install(app) {
    app.mixin({
      methods: {
        requireAuth(callback) {
          const userStore = useUserStore()
          if (userStore.isLoggedIn) {
            if (callback) callback()
          } else {
            this.$store.commit('setLoginRedirect', {
              path: this.$route.fullPath,
              callback: callback ? () => callback() : null
            })
            this.$root.showLoginDialog = true
            return false
          }
        }
      }
    })
  }
}