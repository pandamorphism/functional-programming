/*

  # Summary

  In questa demo vedremo come gestire uno store chiave / valore

  Un primo approccio potrebbe essere quello di usare `IO`

*/

import { Option, fromNullable } from 'fp-ts/lib/Option'
import { IO, io } from 'fp-ts/lib/IO'

export interface Store<A> {
  [key: string]: A
}

export const store: Store<number> = { c: 3 }

export const getValue = (key: string): IO<Option<number>> =>
  new IO(() => fromNullable(store[key]))

export const setValue = (
  key: string,
  value: number
): IO<void> =>
  new IO(() => {
    store[key] = value
  })

const double = (n: number): number => n * 2

/*

  - set a = 1
  - set b = 2
  - get c
  - if found, modify c through double

*/
export const program: IO<void> = setValue('a', 1)
  .chain(() => setValue('b', 2))
  .chain(() => getValue('c'))
  .chain(o =>
    o.fold(io.of(undefined), n => setValue('c', double(n)))
  )

// program.run()
// console.log(store) // { c: 6, a: 1, b: 2 }

/*

  ```
  .chain(() => getValue('c'))
  .chain(o =>
    o.fold(io.of(undefined), n => setValue('c', double(n)))
  )
  ```

  non è un gran che, si può fare di meglio?

*/

const update = (
  key: string,
  f: (n: number) => number
): IO<void> =>
  getValue(key).chain(o =>
    o.fold(io.of(undefined), n => setValue(key, f(n)))
  )

export const program2: IO<void> = setValue('a', 1)
  .chain(() => setValue('b', 2))
  .chain(() => update('c', double))

/*

  Queste API non sono del tutto soddisfacenti,
  è vero che sono molto semplici ma:

  - il tipo dei valori è fissato
  - può lavorare con un solo store globale
  - il programma non è facilmente testabile

*/

import { State, gets, modify, state } from 'fp-ts/lib/State'

export const getValue2 = <A>(
  key: string
): State<Store<A>, Option<A>> =>
  gets(store => fromNullable(store[key]))

export const setValue2 = <A>(
  key: string,
  value: A
): State<Store<A>, void> =>
  modify(store => {
    const r = { ...store }
    r[key] = value
    return r
  })

const update2 = <A>(
  key: string,
  f: (a: A) => A
): State<Store<A>, void> =>
  getValue2<A>(key).chain(o =>
    o.fold(state.of(undefined), n => setValue2(key, f(n)))
  )

/*

  Notate come il codice dell'implementazione con `State`
  sia pressoché identico a quello con `IO`

  ```
  const update = (
    key: string,
    f: (n: number) => number
  ): IO<void> =>
    getValue(key).chain(o =>
      o.fold(io.of(undefined), n => setValue(key, f(n)))
    )
  ```

  Ora posso riscrivere il programma in funzione
  delle nuove API

*/

export const program3 = setValue2('a', 1)
  .chain(() => setValue2('b', 2))
  .chain(() => update2('c', double))

/*

    Questa volta però posso facilmente
    testarlo in divrese condizioni

*/

// console.log(program3.exec({})) // { a: 1, b: 2 }
// console.log(program3.exec({ c: 3 })) // { c: 6, a: 1, b: 2 }
