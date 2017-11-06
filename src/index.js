/**
 * @file 又拍云图片格式化插件
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

import RULES from './config/rules'

import getNetworkType from './utils/get-network-type'
import isWebpSupport from './utils/webp-features-support'
import computeDefaultFormat from './utils/compute-default-format'

let UpyunImageClipper = {} // 插件对象
const FILTER_NAMESPACE = 'image-format' // 过滤器名称
const PLUGIN_TYPE = 'filter'

// 私有方法
const _actions = {
  isWebpSupport,
  computeDefaultFormat,

  /**
   * 获取图片后缀
   */
  getFileExtension(filename) {
    const extReg = /\.([^.]*)$/
    const matched = filename.match(extReg)

    if (!matched) {
      return ''
    }

    return matched[1]
  },
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
  getFinalFormat(format, originFormat, width, minWidth, lossless) {
    // 若指定了图片格式，且不是webp格式，则直接返回
    // 未指定，则使用默认格式
    // 若指定为webp格式
    //   - 则判断源图片gif格式，则判断是否支持动态webp格式，
    //   - 则判断源图片jpg或png格式，则判断是否支持有损webp格式，
    // 如果指定了自定义值，则使用自定义值
    if (!validation.isString(format)) {
      return _actions.computeDefaultFormat(originFormat, width, minWidth,)
    }

    if (format === 'webp') {
      // todo 如果是gif则判断是否支持动效
      // todo 是否强制指定了无损
      // 如果用户指定了图片格式，则以用户自定义为主
      // 若不支持，则动态webp转换为gif格式，其他格式统一转换为jpg格式
      if (originFormat === 'gif' && !_actions.isWebpSupport['animation']) {
        return 'gif'
      } else if (originFormat.match(/jpeg|jpg|png/) && !_actions.isWebpSupport['lossy']) {
        return 'jpg'
      } else {
        return 'webp'
      }
    } else {
      return format
    }
  },

  /**
   * 过滤为undefined和null的值
   */
  filterRules(rules) {
    let filterRules = {}
    Object.entries(rules).forEach(([key, value]) => {
      if (!validation.isNil(value)) {
        filterRules[key] = value
      }
    })

    return filterRules
  },
  /**
   * 其他规则项
   */
  getFinalOtherRules(logger, otherRules) {
    if (validation.isEmpty(otherRules)) {
      return {}
    }

    // 如果本身已是对象格式，则直接返回
    if (validation.isPlainObject(otherRules)) {
      return otherRules
    }

    otherRules = otherRules.startsWith('/') ? otherRules.slice(1) : otherRules

    const rules = otherRules.split('/')

    // 切割后的长度能被整除
    if (rules.length % 2 !== 0) {
      logger.error('other rules is\'t parse! please check')
    }

    const finalOtherRules = {}

    rules.forEach((value, index) => {
      if (index % 2 === 0) {
        finalOtherRules[value] = rules[index + 1]
      }
    })

    return finalOtherRules
  },
  /**
   * 序列化规则
   * 值不存在时，则表示wgkqe和默认值
   * @param {object} rules - 规则配置
   * @returns {string}
   */
  stringifyRule(rules) {
    // 合并默认规则配置
    rules = {
      ...RULES,
      ..._actions.filterRules(rules),
    }

    const filterRules = _actions.filterRules(rules)

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
 * 值可以是null或者undefined，当是这个值的时候，使用默认值
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
  minWidth = global.document.documentElement.clientWidth * global.devicePixelRatio / 2,
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
   * @param {?number|string|object} [size] - 裁剪尺寸，取设计稿中的尺寸即可，如果是一个配置对象，则无视后面的参数配置
   * @param {?string} [scale='both'] - 又拍云图片尺寸缩放方式
   * @param {?string} [format] - 又拍云图片格式化，不同条件有不同的选择，具体格式按具体场景区分
   * @param {?number} [quality=90] - 又拍云jpg格式图片默认质量
   * @param {?string|object} [rules=''] - 又拍云的其他规则，注意，他是一个键值对的关系，不要随意乱写，这里的值不会覆盖前面已定义过的值
   */
  Vue.filter(FILTER_NAMESPACE, (src, sizeOrConfig, customScale = scale, customformat, customQuality = quality, otherRules = rules) => {
    // 如果未传入图片地址，则返回空值
    if (validation.isUndefined(src) || validation.isEmpty(src)) {
      return ''
    }

    const DPR = global.devicePixelRatio || 1 // 当前设备DPR
    const networkType = networkHandler() || 'unknow' // 当前网络制式，每次重新获取，因网络随时会变化

    // 如果size是一个对象，则表示是以字典的方式进行配置参数
    let size, scale, format, quality, rules
    if (validation.isPlainObject(sizeOrConfig)) {
      const { size: sizeOption, scale: scaleOption, format: formatOption, quality: qualityOption, ...rulesOption } = sizeOrConfig

      size = sizeOption
      scale = scaleOption
      format = formatOption
      quality = qualityOption
      rules = rulesOption
    } else {
      size = sizeOrConfig
      scale = customScale
      format = customformat
      quality = customQuality
      rules = otherRules
    }

    logger.log('network:', networkType)
    logger.log('origin dpr:', DPR)
    logger.log('draftRatio:', draftRatio)
    logger.log('origin image src:', src)
    logger.log('origin image size:', size)
    logger.log('origin rules:', rules)

    let finalDPR = _actions.getFinalDPR(networkType, DPR, maxDPR) // 最终的DPR取值
    let finalSize = _actions.getFinalSize(size, finalDPR, draftRatio) // 最终的尺寸取值
    let finalFormat = _actions.getFinalFormat(format, _actions.getFileExtension(src), finalSize.split('x')[0], minWidth) // 最终的图片格式
    let finalScale = scale || RULES.scale // 最终的缩放取值
    let finalQuality = quality || RULES.quality // 最终的质量取值
    let finalRules = _actions.getFinalOtherRules(logger, rules) // 最终的其他规则取值

    logger.log('final image size:', finalSize)
    logger.log('final image DPR:', finalDPR)
    logger.log('final image scale:', finalScale)
    logger.log('final image quality:', finalQuality)
    logger.log('final image format:', finalFormat)
    logger.log('final image custom rules:', finalRules)

    const stringifyRule = _actions.stringifyRule({
      ...finalRules,
      format: finalFormat,
      scale: finalScale, // 缩放规格
      size: finalSize, // 图片尺寸
      quality: finalQuality, // jpg图片压缩质量
    })

    logger.log('final image rule:', stringifyRule)

    // 拼接最终的结果
    let finalSrc = src + stringifyRule

    logger.log('final image src:', finalSrc)

    return finalSrc
  })
}

export default UpyunImageClipper
