/**
 * @file 又拍云图片格式化插件
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

import RULES from './rules'

import isWebpSupport from './utils/webp-features-support'
import getNetworkType from './utils/get-network-type'

let UpyunImageClipper = {} // 插件对象
const FILTER_NAMESPACE = 'image-format' // 过滤器名称
const PLUGIN_TYPE = 'filter'

// 私有方法
const _actions = {
  /**
   * 根据当前的网络制式，获取最终的DPR值
   *
   * @param networkType
   * @param DPR
   * @param maxDPR
   * @returns {*}
   */
  getFinalDPR(networkType, DPR, maxDPR) {
    if (networkType === '4g') {
      return DPR >= maxDPR ? maxDPR : DPR
    } else if (networkType === 'wifi') {
      return DPR
    } else {
      return 1
    }
  },
  /**
   * 获取图片尺寸
   * @param size
   * @param finalDPR
   * @param draftRatio
   * @returns {string}
   */
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
  },
  /**
   * 获取图片格式
   * @param format
   */
  getFinalFormat(format, originFormat, lossless) {
    // 若指定了图片格式，且不是webp格式，则直接返回
    if (validation.isString(format) && format !== 'webp') {
      return format
    } else if (format === 'webp') {
      // todo 如果是gif则判断是否支持动效
      // 如果用户指定了图片格式，则以用户自定义为主
      // 若不支持，则动态webp转换为gif格式，其他格式统一转换为jpg格式
      if (isWebpSupport['loose']) {
        return format
      }

      // 如果不支持
      if (originFormat === 'gif') {
        return 'gif'
      } else {
        return 'jpg'
      }
    } else {
      // 未指定，则使用默认格式
      return 'jpg'
    }
  },

  /**
   * 序列化规则
   * @param {object} rules - 规则配置
   * @returns {string}
   */
  stringifyRule(rules) {
    // 合并默认规则配置
    rules = {
      ...RULES,
      ...rules,
    }

    // 移除设置为null或undefined的值
    const filterRules = {}

    Object.entries(rules).forEach(([key, value]) => {
      if (!validation.isNil(value)) {
        filterRules[key] = value
      }
    })

    const len = Object.keys(filterRules).length

    // 不存在值时，直接返回空字符串
    if (len === 0) {
      return ''
    }

    // 提前取出缩放方式(scale)和尺寸(size)进行设置
    let imageSrc = validation.isNil(filterRules.size) ? '' : `/${filterRules.scale}/${filterRules.size}`

    imageSrc += Object.entries(filterRules).reduce((result, [key, value]) => {
      if (key === 'size' || key === 'scale') {
        return result
      }

      return result + `/${key}/${value}`
    }, '')

    // 尺寸规格或其他规则至少存在一项时，加上前缀`!`修饰符号
    return validation.isEmpty(imageSrc) ? '' : '!' + imageSrc
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
 * @param {number} [options.quality=90] - 又拍云jpg格式图片默认质量
 * @param {string} [options.scale='both'] - 又拍云图片尺寸缩放方式，默认宽度进行自适应，超出尺寸进行裁剪，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪
 * @param {string} [options.rules=''] - 又拍云图片格式化的其他规则
 * @param {function} [options.networkHandler=xxxx] - 获取网络制式的处理函数
 */
UpyunImageClipper.install = async function (Vue, {
  debug = false,
  maxDPR = 3,
  draftRatio = 2,
  scale = RULES.scale,
  quality = RULES.quality,
  rules = '',
  networkHandler = getNetworkType
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
   * @param {?number} [quality=90] - 又拍云jpg格式图片默认质量
   * @param {?string} [rules=''] - 又拍云的其他规则
   */
  Vue.filter(FILTER_NAMESPACE, (src, size, customScale = scale, format, customQuantity = quality, customRules = rules) => {
    // 如果未传入图片地址，则返回空值
    if (validation.isUndefined(src) || validation.isEmpty(src)) {
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

    let finalDPR = _actions.getFinalDPR(networkType, DPR, maxDPR) // 最终的DPR取值
    let finalSize = _actions.getFinalSize(size, finalDPR, draftRatio) // 最终的尺寸取值
    let finalFormat = _actions.getFinalFormat('jpg', 'gif') // 最终的图片格式
    let finalScale = 'both' // 最终的缩放取值

    logger.log('final image size:', finalSize)
    logger.log('final image DPR:', finalDPR)
    logger.log('final image scale:', finalScale)
    logger.log('final image format:', finalFormat)
    logger.log('final image rules:', customRules)

    // 拼接最终的结果
    let finalSrc = src + _actions.stringifyRule({
      format: finalFormat,
      scale: finalScale, // 缩放规格
      size: finalSize, // 图片尺寸
      // compress: true, // 压缩优化
      // quality: '', // jpg图片压缩质量
      // progressive:true, // 是否启用模
    })

    logger.log('final image src:', finalSrc)

    return finalSrc
  })
}

export default UpyunImageClipper
