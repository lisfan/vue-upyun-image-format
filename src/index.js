/**
 * @file 又拍云图片格式化插件
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

let UpyunImageClipper = {} // 插件对象
const FILTER_NAMESPACE = 'image-size' // 过滤器名称
const PLUGIN_TYPE = 'filter'

// 私有方法
const _actions = {
  // 获取最终的DPR值
  getFinalDPR(networkType, DPR, maxDPR) {
    if (networkType === '4g') {
      return DPR >= maxDPR ? maxDPR : DPR
    } else if (networkType === 'wifi') {
      return DPR
    } else {
      return 1
    }
  },
  // 获取图片尺寸
  getFinalSize(size, finalDPR, draftRatio) {
    let isValidSize = false
    let finalSizeList = []

    if (!validation.isNull(size)) {
      // 计算图片尺寸
      const sizeList = size.toString().split('x')

      finalSizeList = sizeList.map((sizeItem) => {
        return Math.round((Number.parseFloat(sizeItem) / draftRatio) * finalDPR)
      })

      // 查看是否存在NaN项
      isValidSize = !finalSizeList.some((size) => {
        return validation.isNaN(size)
      })
    }

    return isValidSize ? finalSizeList.join('x') : ''
  }
}
/**
 * 又拍云图片格式化注册函数
 * 规则请参考[又拍云文档](http://docs.upyun.com/cloud/image/#webp)
 *
 * 又拍云图片上传默认未压缩
 * @param {Vue} Vue - Vue类
 * @param {object} [options={}] - 配置选项
 * @param {boolean} [options.debug=false] - 是否开启日志调试模式，默认关闭
 * @param {number} [options.maxDPR=3] - 4g网络下，DPR取值的最大数，默认值为3
 * @param {number} [options.draftRatio=2] - UI设计稿尺寸与设备物理尺寸的比例，默认值为2
 * @param {number} [options.quantity=90] - 又拍云jpg格式图片默认质量
 * @param {string} [options.scale='both'] - 又拍云图片尺寸缩放方式，默认宽度进行自适应，超出尺寸进行裁剪，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪
 * @param {string} [options.rules=''] - 又拍云图片格式化的其他规则
 * @param {function} [options.networkHandler=xxxx] - 获取网络制式的处理函数
 */
UpyunImageClipper.install = function (Vue, {
  debug = false,
  maxDPR = 3,
  draftRatio = 2,
  scale = 'both',
  quantity = 90,
  rules = '',
  networkHandler
} = {}) {
  const logger = new Logger({
    name: `${PLUGIN_TYPE}:${FILTER_NAMESPACE}`,
    debug
  })

  // 插件注册时验证是否会存在网络制式处理器，若不存在，则抛出错误
  if (!validation.isFunction(networkHandler)) {
    logger.error(`Vue plugin install faild! require a (networkHandler) option property, type is (function), please check!`)
  }

  /**
   * 接受四个参数
   *
   * @param {string} src - 图片地址
   * @param {?number|string} [size] - 裁剪尺寸，取设计稿中的尺寸即可
   * @param {?string} [scale='both'] - 又拍云图片尺寸缩放方式
   * @param {?string} [format] - 又拍云图片格式化，不同条件有不同的选择，具体格式按具体场景区分
   * @param {?number} [quantity=90] - 又拍云jpg格式图片默认质量
   * @param {?string} [rules=''] - 又拍云的其他规则
   */
  Vue.filter(FILTER_NAMESPACE, (src, size, scaleSpecs = scale, format, quantitySpecs = quantity, rulesSpecs = rules) => {
    // 如果未传入图片地址，则返回空值
    if (validation.isUndefined(src)) {
      return ''
    }

    // todo
    // 如果size是一个对象，则表示做对象方式配置数据

    const DPR = global.devicePixelRatio || 1 // 当前设备DPR
    const networkType = networkHandler() || 'unknow' // 当前网络制式

    logger.log('origin image src:', src)
    logger.log('origin image size:', size)
    logger.log('network:', networkType)
    logger.log('origin dpr:', DPR)
    logger.log('draftRatio:', draftRatio)

    let isValidSize = true // 是否存在有效的尺寸，若尺寸均无效，则使用原尺寸
    let finalDPR = _actions.getFinalDPR(networkType, DPR, maxDPR) // 最终的DPR取值
    let finalSize = _actions.getFinalSize(size, finalDPR, draftRatio) // 最终的尺寸取值
    let finalScale = '' // 最终的缩放取值

    
    // 尺寸为null或者解析为NaN时
    if (finalSize) {
      finalScale = `/${scaleSpecs}/${finalSize}`
    }

    // 最终其他规则项
    let finalRules = rulesSpecs
    if (rulesSpecs && !rulesSpecs.startsWith('/')) {
      finalRules = '/' + rulesSpecs
    }

    // 尺寸规格或其他规则至少存在一项时，加上前缀`!符号`
    let finalSrc = finalScale + finalRules
    if (finalScale || finalRules) {
      finalSrc = '!' + finalSrc
    }

    finalSrc = src + finalSrc

    logger.log('final image size:', finalSize)
    logger.log('final image DPR:', finalDPR)
    logger.log('final image scale:', finalScale)
    logger.log('final image rules:', finalRules)
    logger.log('final image src:', finalSrc)

    return finalSrc
  })
}

export default UpyunImageClipper
