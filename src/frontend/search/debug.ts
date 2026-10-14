/* eslint-disable no-console */
export type Msg =
  | 'initstart'
  | 'initend'
  | 'datalength'
  | 'bucketlength'
  | 'searchinit'
  | 'searchend'
  | 'shortquery'
  | 'returnfromcache'
  | 'preprocessingerror'

export function debug(msg: Msg, ...args: unknown[]): void {
  const data = args ?? []

  switch (msg) {
    case 'initstart':
      console.log('\n')
      console.time('ACS: preprocessing')
      break

    case 'initend':
      console.timeEnd('ACS: preprocessing')
      break

    case 'preprocessingerror':
      console.log('ACS: preprocessing error: ', data[0])
      break

    case 'datalength':
      console.log('ACS: data length: ', data[0])
      break

    case 'bucketlength':
      console.log('ACS: buckets length: ', data[0])
      break

    case 'searchinit':
      console.time('ACS: search took')
      console.log(`\nACS: search for query %c"${data[0]}"`, 'font-weight: bold; color: orange')
      break

    case 'shortquery':
      console.log('ACS: short query, returning %c[]%c', 'color: yellow; font-weight: bold', '')
      console.timeEnd('ACS: search took')
      break

    case 'returnfromcache':
      console.log(
        `ACS: %cRETURNING%c ${data[0]} %cFROM CACHE`,
        'color: lightgreen; font-weight: bold; text-decoration: underline',
        'color: red;',
        'color: lightgreen; font-weight: bold; text-decoration: underline',
      )
      console.timeEnd('ACS: search took')
      break

    case 'searchend':
      console.log(
        `ACS: %ccaching%c ${data[0]} results%c for query %c"${data[1]}"`,
        'text-decoration: underline',
        'text-decoration: none; font-weight: bold; color: cyan;',
        'color: yellow;',
        'font-weight: normal; color: lightgreen; text-decoration: underline',
      )
      console.log(
        `ACS: searched %c${data[2]}%c of %c${data[3]} %citems%c, %c${data[4]}%c of %c${data[5]} %cbuckets`,
        'color: salmon; font-weight: bold',
        '',
        'color: salmon',
        'color: unset; text-decoration: underline',
        '',
        'color: yellow; font-weight: bold',
        '',
        'color: yellow',
        'color: unset; text-decoration: underline',
      )
      console.timeEnd('ACS: search took')
      break

    default:
      break
  }
}
