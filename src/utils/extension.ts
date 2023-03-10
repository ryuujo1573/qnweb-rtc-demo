Map.prototype.toArray = function toArray<K, V>(this: Map<K, V>) {
  return Array.from(this.values())
}

function isPropertyKey(t: any): t is PropertyKey {
  return typeof t == 'number' || typeof t == 'string' || typeof t == 'symbol'
}

Array.prototype.groupBy = function groupBy<T, TK extends keyof T>(
  this: Array<T>,
  by:
    | (T[TK] extends PropertyKey ? TK : never)
    | ((item: T, index: number, array: T[]) => PropertyKey)
) {
  const result: {
    [key: PropertyKey]: T[]
  } = {}
  this.forEach((item, i, arr) => {
    let groupName
    if (typeof by == 'function') {
      groupName = by(item, i, arr)
    } else {
      groupName = item[by]
      if (!isPropertyKey(groupName)) {
        return
      }
    }
    if (groupName in result) {
      result[groupName].push(item)
    } else {
      result[groupName] = [item]
    }
  })
  return result
}

export {}
