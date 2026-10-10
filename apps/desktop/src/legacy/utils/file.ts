interface FormatOptions {
  decimals?: number // 小数位数
  separator?: string // 数字和单位之间的分隔符
  pad?: boolean // 是否填充小数位
  roundDown?: boolean // 是否向下取整
  stripTrailingZeros?: boolean // 是否去除尾随零
  locale?: string // 数字本地化格式
  binary?: boolean // 是否使用二进制(1024)而不是十进制(1000)
}

const DECIMAL = 1000
const BINARY = 1024
const UNITS_DECIMAL = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const UNITS_BINARY = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

export function formatFileSize(bytes: number, options: FormatOptions = {}): string {
  const {
    decimals = 2,
    separator = ' ',
    pad = false,
    roundDown = false,
    stripTrailingZeros = false,
    locale = undefined,
    binary = true,
  } = options

  if (bytes === 0)
    return `0${separator}B`

  const base = binary ? BINARY : DECIMAL
  const units = binary ? UNITS_BINARY : UNITS_DECIMAL

  const exponent = Math.floor(Math.log(bytes) / Math.log(base))
  const value = bytes / base ** exponent

  const roundedValue = roundDown
    ? Math.floor(value * 10 ** decimals) / 10 ** decimals
    : Number(value.toFixed(decimals))

  let formattedValue: string

  if (locale) {
    formattedValue = roundedValue.toLocaleString(locale, {
      minimumFractionDigits: pad ? decimals : 0,
      maximumFractionDigits: decimals,
    })
  }
  else {
    formattedValue = pad
      ? roundedValue.toFixed(decimals)
      : roundedValue.toString()

    if (stripTrailingZeros) {
      formattedValue = Number.parseFloat(formattedValue).toString()
    }
  }

  return `${formattedValue}${separator}${units[exponent]}`
}

export function isPictureFile(path: string): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(path.split('.').pop() ?? '')
}

// 基本使用
// console.log(formatFileSize(fileSize));
// "1.18 MiB"

// 使用十进制单位
// console.log(formatFileSize(fileSize, { binary: false }));
// "1.23 MB"

// 自定义小数位
// console.log(formatFileSize(fileSize, { decimals: 3 }));
// "1.177 MiB"

// 使用不同分隔符
// console.log(formatFileSize(fileSize, { separator: '-' }));
// "1.18-MiB"

// 本地化格式
// console.log(formatFileSize(fileSize, { locale: 'de-DE' }));
// "1,18 MiB"

// 填充小数位
// console.log(formatFileSize(1024, { pad: true }));
// "1.00 KiB"

// 去除尾随零
// console.log(formatFileSize(1024, { stripTrailingZeros: true }));
// "1 KiB"

// 向下取整
// console.log(formatFileSize(1234567, { roundDown: true }));
// "1.17 MiB"
