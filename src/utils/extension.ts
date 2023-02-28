Map.prototype.toArray = function toArray<K, V>(this: Map<K, V>) {
  return Array.from(this.values())
}

export {}
