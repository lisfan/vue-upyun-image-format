/**
 * @file 获取网络制式
 */

/**
 * 获取网络制式
 *
 * [注] 检测浏览器是否支持navigator的connection API
 *
 * @return {string}
 */
export default function getNetworkType() {
  // 检测NetworkInformation接口是否存在，若存在

  if (!navigator.connection) {
    return 'unknow'
  }

  return navigator.connection.effectiveType
}