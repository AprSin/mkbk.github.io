import { createPinia } from 'pinia'
import { useMarketStore } from './modules/market'
import { useUserStore } from './modules/user'
import { useOrderStore } from './modules/order'

const pinia = createPinia()

export {
  useMarketStore,
  useUserStore,
  useOrderStore
}

export default pinia
