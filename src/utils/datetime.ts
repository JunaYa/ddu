// 时间格式化
// Date
// return 
/**
 * 时间格式化
 * @param time Date
 * @param format 格式化字符串
 * @returns 格式化后的时间
 */
export function formatTime(time: Date, format: string) {
  const year = time.getFullYear()
  const month = time.getMonth() + 1
  const day = time.getDate()
  const hour = time.getHours()
  const minute = time.getMinutes()
  const second = time.getSeconds()

  return format.replace('YYYY', year.toString()).replace('MM', month.toString()).replace('DD', day.toString()).replace('HH', hour.toString()).replace('mm', minute.toString()).replace('ss', second.toString())
}