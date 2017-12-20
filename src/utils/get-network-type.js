/**
 * @file 获取网络制式
 */

/**
 * 获取网络制式
 *
 * [注] 检测浏览器是否支持navigator的connection API
 *
 * @since 1.0.0
 *
 * @returns {string}
 */
export default function getNetworkType() {
  // 检测NetworkInformation接口是否存在，若不存在，则返回unknow
  return !navigator.connection
    ? 'unknow'
    : navigator.connection.effectiveType || 'unknow'
}