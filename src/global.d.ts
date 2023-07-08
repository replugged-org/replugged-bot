/* eslint-disable */

type NonFalsy<T> = T extends false | 0 | "" | null | undefined | 0n ? never : T;

type WidenLiteral<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends bigint
  ? bigint
  : T extends symbol
  ? symbol
  : T;

interface ReadonlyArray<T> {
  includes(searchElement: T | (WidenLiteral<T> & {}), fromIndex?: number): boolean;
}

interface Array<T> {
  includes(searchElement: T | (WidenLiteral<T> & {}), fromIndex?: number): boolean;
}

// src/entrypoints/array-index-of.d.ts
interface ReadonlyArray<T> {
  lastIndexOf(searchElement: T | (WidenLiteral<T> & {}), fromIndex?: number): number;
  indexOf(searchElement: T | (WidenLiteral<T> & {}), fromIndex?: number): number;
}

interface Array<T> {
  lastIndexOf(searchElement: T | (WidenLiteral<T> & {}), fromIndex?: number): number;
  indexOf(searchElement: T | (WidenLiteral<T> & {}), fromIndex?: number): number;
}

// src/entrypoints/filter-boolean.d.ts
interface Array<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
}

interface ReadonlyArray<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
}

// src/entrypoints/map-has.d.ts
interface Map<K, V> {
  has(value: K | (WidenLiteral<K> & {})): boolean;
}

interface ReadonlyMap<K, V> {
  has(value: K | (WidenLiteral<K> & {})): boolean;
}

// src/entrypoints/set-has.d.ts
interface Set<T> {
  has(value: T | (WidenLiteral<T> & {})): boolean;
}

interface ReadonlySet<T> {
  has(value: T | (WidenLiteral<T> & {})): boolean;
}
