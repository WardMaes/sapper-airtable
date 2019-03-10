import { run_all, noop } from 'svelte/internal'
import { readable } from 'svelte/store'
export const neverP = new Promise(() => {})
export function lazyloadable(key, start, value) {
  return loadable((set, first) => {
    if (!process.browser) {
      return
    }
    if (first) {
      const local = ls(key)
      if (local) {
        return set(local)
      }
      set(value)
    }
    console.log('lazyloadable start', first)
    return Promise.resolve(start()).then(events => {
      set(events)
      setTimeout(() => ls(key, events), 100)
    })
  }, value)
}
export function readableLocalCache(key, update, value, seconds = 60) {
  let init = true
  let isLocal = process.browser && !!localStorage[key]
  return readableCache(
    set => {
      if (!process.browser) {
        return
      }
      // TODO reconsider
      if (isLocal) {
        return
      }
      isLocal = true
      update(set)
    },
    process.browser && localStorage[key]
      ? JSON.parse(localStorage[key])
      : value,
    seconds
  )
}
export function readableCache(update, value, seconds) {
  let lastFetch = 0
  return readable(set => {
    if (Date.now() - lastFetch > seconds * 1000) {
      lastFetch = Date.now()
      update(set)
    }
  }, value)
}
export function readableAsync(update, value) {
  return readable(set => {
    return update(prom => {
      if (prom && prom.then) {
        prom.then(set)
      } else {
        set(prom)
      }
    })
  })
}
export function deriveAsync(stores, fn = () => {}, value = {}) {
  const single = !Array.isArray(stores)
  if (single) stores = [stores]
  const auto = fn.length < 2
  return readableAsync(set => {
    let inited = false
    const values = []
    let pending = 0
    const sync = () => {
      if (pending) return
      const result = fn(single ? values[0] : values, set)
      if (auto && value !== (value = result)) set(result)
    }
    const unsubscribers = stores.map((store, i) =>
      store.subscribe(
        value => {
          values[i] = value
          pending &= ~(1 << i)
          if (inited) sync()
        },
        () => {
          pending |= 1 << i
        }
      )
    )
    inited = true
    sync()
    return function stop() {
      run_all(unsubscribers)
    }
  }, value)
}
export function ls(key, value) {
  if (!process.browser) {
    return
  }
  if (typeof value !== 'undefined') {
    window.localStorage[key] = JSON.stringify(value)
    return value
  }
  if (window.localStorage[key]) {
    return JSON.parse(window.localStorage[key])
  }
}
export function sortBy(arr, field) {
  return arr.slice().sort((a, b) => {
    return a[field] < b[field] ? -1 : a[field] === b[field] ? 0 : 1
  })
}

export function loadable(db, table, filter = {}) {
  const subscribers = []
  let stop
  let value = []

  function set(newValue) {
    if (newValue === value) return
    value = newValue
    subscribers.forEach(s => s[1]())
    subscribers.forEach(s => s[0](value))
  }

  function find(id) {
    return db.find(table, id)
  }
  function select() {
    return db
      .select(table, filter)
      .then(set)
      .then(() => value)
  }
  function create(data) {
    return db.create(table, data).then(data => select() && data)
  }
  function update(id, data) {
    return db.update(table, id, data).then(data => select() && data)
  }
  function destroy(id) {
    return db.destroy(table, id).then(data => select() && data)
  }

  return {
    create,
    find,
    select,
    update,
    destroy,
    get() {
      return value
    },
    subscribe(run, invalidate = noop) {
      if (subscribers.length === 0) {
        set(value)
        select()
      }

      const subscriber = [run, invalidate]
      subscribers.push(subscriber)
      run(value)

      return function() {
        const index = subscribers.indexOf(subscriber)
        if (index !== -1) subscribers.splice(index, 1)
      }
    }
  }
}
