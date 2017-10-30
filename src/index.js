/**
 * @file 又拍云图片尺寸裁切插件
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import _ from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

let UpyunImageClipper = {} // 插件对象
const FILTER_NAMESPACE = 'image-size' // 过滤器名称
const PLUGIN_TYPE = 'filter'

/**
 * 获取网络制式的函数
 */
// const getNetworkHandler = function () {
//   // 检测NetworkInformation接口是否存在，若存在
//   if (!navigator.connection) {
//     return false
//   }
//
//   return navigator.connection.effectiveType
// }

/**
 * 又拍云图片尺寸裁切注册函数
 * 规则请参考[又拍云文档](http://docs.upyun.com/cloud/image/#webp)
 *
 * @param {Vue} Vue - Vue类
 * @param {object} [options={}] - 配置选项
 * @param {number} [options.debug=false] - 是否开启日志调试模式，默认关闭
 * @param {number} [options.maxDPR=3] - 4g网络下，DPR取值的最大数，默认值为3
 * @param {number} [options.draftRatio=2] - ui尺寸和设备物理尺寸的比例，默认值为2：以我们在基于ip6 350px宽的基础上，UI设计师放大2倍以750宽进行设计
 * @param {string} [options.specs='both'] - 又拍云尺寸裁剪方式，默认'both'进行固定宽度和高度，宽高不足时居中裁剪再缩放
 * @param {string} [options.rule=''] - 又拍云的其他规则，需要以'/'开头
 */
UpyunImageClipper.install = function (Vue, {
  debug = false,
  maxDPR = 3,
  draftRatio = 2,
  specs = 'both',
  rule = '',
  networkHandler
} = {}) {
  const logger = new Logger({
    name: `${PLUGIN_TYPE}:${FILTER_NAMESPACE}`,
    debug
  })

  // 插件注册时验证是否会存在网络制式处理器，若不存在，则抛出错误
  if (!_.isFunction(networkHandler)) {
    logger.error(`Vue plugin install faild! require a (networkHandler) option property, type is (function), please`)
  }

  /**
   * 接受四个参数
   *
   * @param {string} src - 图片地址
   * @param {number|string} size - 裁剪尺寸，取设计稿中的尺寸即可
   * @param {string} [specsType='both'] - 又拍云尺寸裁剪方式，默认'both'进行固定宽度和高度，宽高不足时居中裁剪再缩放
   * @param {string} [rule=''] - 又拍云的其他规则，需要以'/'开头
   */
  Vue.filter(FILTER_NAMESPACE, (src, size, specsType = specs, otherRule = rule) => {
    // 如果未传入图片地址，则返回空值
    if (_.isUndefined(src)) {
      return ''
    }

    // 数据类型验证：非数字和图片时提示参数错误
    if (!_.isNumber(size) && !_.isString(size)) {
      logger.error(`(${FILTER_NAMESPACE}) ${PLUGIN_TYPE} require a size param, type is (number) or (string)`)
    }

    const dpr = global.devicePixelRatio || 1 // 当前设备dpr
    const networkType = networkHandler() || 'unknow' // 当前网络制式

    logger.log('origin image src:', src)
    logger.log('origin image size:', size)
    logger.log('origin dpr:', dpr)
    logger.log('draftRatio:', draftRatio)
    logger.log('network:', networkType)
    logger.log('upyun clipper specs:', specsType)
    logger.log('upyun other specs rule:', otherRule)

    let finalDPR
    let finalSize

    if (networkType === '4g') {
      finalDPR = dpr >= maxDPR ? maxDPR : dpr
    } else if (networkType === 'wifi') {
      finalDPR = dpr
    } else {
      // 未知网络下，使用dpr1
      finalDPR = 1
    }

    // 计算尺寸
    const sizeList = size.toString().split('x')

    const finalSizeList = sizeList.map((sizeItem) => {
      return Math.round((Number.parseFloat(sizeItem) / draftRatio) * finalDPR)
    })

    finalSize = finalSizeList.join('x')

    const finalSrc = `${src}!/${specsType}/${finalSize}${otherRule}`

    logger.log('final image size:', finalSize)
    logger.log('final dpr:', finalDPR)
    logger.log('final image src:', finalSrc)

    return finalSrc
  })
}

export default UpyunImageClipper
