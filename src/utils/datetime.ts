
/// get a description of passed time from given time.
export function getPassedTimeDesc(then: Date) {
  let seconds = new Date().getTime() - then.getTime()

  const min = 60 * 1000
    , hour = min * 60
    , day = hour * 24
    , week = day * 7
    , month = week * 4
    , year = month * 12

  const direction = seconds > 0 ? '前' : '后'

  const exceedYear = Math.floor(Math.abs(seconds / year))
  const exceedMonth = Math.floor(Math.abs(seconds / month))
  const exceedWeek = Math.floor(Math.abs(seconds / week))
  const exceedDay = Math.floor(Math.abs(seconds / day))
  const exceedHour = Math.floor(Math.abs(seconds / hour))
  const exceedMin = Math.floor(Math.abs(seconds / min))

  if (exceedYear) {
    return exceedYear + '年' + direction
  } else if (exceedMonth) {
    return exceedMonth + '月' + direction
  } else if (exceedWeek) {
    return exceedWeek + '周' + direction
  } else if (exceedDay) {
    return exceedDay + '天' + direction
  } else if (exceedHour) {
    return exceedHour + '小时' + direction
  } else if (exceedMin) {
    return exceedMin + '分钟' + direction
  } else {
    return seconds + '秒' + direction
  }
}