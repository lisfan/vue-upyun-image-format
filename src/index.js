/**
 * @file 又拍云图片格式化插件
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

import getNetworkType from './utils/get-network-type'
import isWebp from './utils/webp-features-support'
import computeDefaultFormat from './utils/compute-default-format'

let ImageFormat = {} // 插件对象
const PLUGIN_TYPE = 'filter' // 插件类型
const FILTER_NAMESPACE = 'image-format' // 过滤器名称

// 私有方法
const _actions = {
  /**
   * 获取图片后缀
   * 【注】假设图片文件末尾都是以存在后缀的，未兼容处理那些不带后缀形式的图片文件
   *
   * @param {string} filename - 文件名称
   * @returns {string}
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
   * @param {string} networkType - 网络制式类型
   * @param {number} DPR - 设备像素比
   * @param {number} maxDPR - 支持的最大设备像素比
   * @returns {number}
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
   * 获取最终的图片尺寸
   *
   * @param {?number|string} size - 自定义尺寸
   * @param {number} finalDPR
   * @param {number} draftRatio
   * @returns {?string}
   */
  getFinalSize(size, finalDPR, draftRatio) {
    // 是否存在有效的尺寸值
    let isValidSize = false

    let finalSizeList = []

    if (!validation.isNil(size)) {
      const sizeList = size.toString().split('x')

      finalSizeList = sizeList.map((sizeItem) => {
        return Math.round((Number.parseFloat(sizeItem) / draftRatio) * finalDPR)
      })

      // 查看是否存在NaN项
      isValidSize = !finalSizeList.some((size) => {
        return validation.isNaN(size)
      })
    }

    return isValidSize ? finalSizeList.join('x') : null
  },
  /**
   * 根据条件，获取最终的图片格式
   * @param {string} format - 自定义格式
   * @param {string} originFormat - 原格式
   * @param {number} width - 自定义尺寸
   * @param {number} minWidth - 最小尺寸
   * @param {boolean} [lossless] - 是否转换为无损webp格式
   * @returns {string}
   */
  getFinalFormat(format, originFormat, width, minWidth, lossless) {
    // 若未自定义图片格式，则根据一些条件，设置默认格式
    // 若自定义了图片格式，且不是指定为webp格式，则直接返回指定的格式
    // 若指定为webp格式
    //   - 若源图片gif格式，则检测是否支持动态webp格式，
    //   - 若源图片jpg或png格式，则检测是否支持有损webp格式或无损webp格式
    // 如果指定了自定义值，则使用自定义值
    if (!validation.isString(format)) {
      return computeDefaultFormat(originFormat, width, minWidth)
    }

    if (format === 'webp') {
      // 若源图片gif格式，则检测是否支持动态webp格式，若不支持则转换为gif格式
      //   - 若源图片jpg或png格式，则检测是否支持有损webp格式或无损webp格式
      if (originFormat === 'gif' && !isWebp.support('animation')) {
        return 'gif'
      } else if (originFormat.match(/jpeg|jpg|png/) && !lossless && !isWebp.support('lossy')) {
        return 'jpg'
      } else if (originFormat.match(/jpeg|jpg|png/) && lossless && !isWebp.support('lossless')) {
        return 'jpg'
      } else {
        return 'webp'
      }
    }

    // 返回源格式
    return format
  },

  /**
   * 过滤为undefined、null及空值
   * @param {object} rules - 规则配置
   * @returns {object}
   */
  filterRules(rules) {
    let filterRules = {}
    Object.entries(rules).forEach(([key, value]) => {
      if (!validation.isNil(value) && !validation.isEmpty(value)) {
        filterRules[key] = value
      }
    })

    return filterRules
  },
  /**
   * 获取自定义的其他又拍云规则项
   * [注] 规则项需要有对应关系，不可随意填写
   *
   * @param {object} otherRules- 其他又拍云规则项
   * @returns {object}
   */
  getFinalOtherRules(otherRules) {
    if (validation.isEmpty(otherRules)) {
      return {}
    }

    // 如果本身已是对象格式，则直接返回
    if (validation.isPlainObject(otherRules)) {
      return otherRules
    }

    otherRules = otherRules.startsWith('/') ? otherRules.slice(1) : otherRules

    const rules = otherRules.split('/')

    // 分割后的的数据长度能被2整除，无余数
    if (rules.length % 2 !== 0) {
      throw new Error('other rules is\'t parse! please check')
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
   * 根据图片格式进一步优化规则
   * 目前只有两条规则，所以不采用策略，直接进行逻辑判断
   *
   * @param {object} rules - 优化规则
   * @return {object}
   */
  optimizeRules(rules) {
    // 若未jpg格式，且不存在模糊到清晰配置时，
    if (!validation.isBoolean(rules.progressive) && rules.format === 'jpg') {
      rules.progressive = true
    } else if (!validation.isBoolean(rules.progressive) && rules.format === 'png') {
      rules.compress = true
    }

    return rules
  },
  /**
   * 序列化规则为符合格式的字符串
   *
   * @param {object} rules - 规则配置
   * @returns {string}
   */
  stringifyRule(rules) {
    const filterRules = _actions.filterRules(rules)

    // 处理针对格式的优化
    rules = _actions.optimizeRules(rules)

    // 不存在值时，直接返回空字符串
    if (Object.keys(filterRules).length === 0) {
      return ''
    }

    // 提前取出缩放方式(scale)和尺寸(size)进行额外的处理，其他值做拼接
    let imageSrc = validation.isNil(filterRules.size) ? '' : `/${filterRules.scale}/${filterRules.size}`

    imageSrc += Object.entries(filterRules).reduce((result, [key, value]) => {
      if (key === 'size' || key === 'scale') {
        return result
      }

      return result + `/${key}/${value}`
    }, '')

    // 规则至少存在一项时，则加上前缀`!`修饰符号
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
ImageFormat.install = async function (Vue, {
  debug = false,
  maxDPR = 3,
  draftRatio = 2,
  scale = 'both',
  quality = 90,
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
  Vue.filter(FILTER_NAMESPACE, (src, sizeOrConfig, customScale = scale, customformat, customQuality = quality, customOtherRules = rules) => {
    // 如果未传入图片地址，则返回空值
    if (validation.isUndefined(src) || validation.isEmpty(src)) {
      return ''
    }

    const DPR = global.devicePixelRatio || 1 // 当前设备DPR
    const networkType = networkHandler() || 'unknow' // 当前网络制式，每次重新获取，因网络随时会变化

    // 如果size是一个对象，则表示是以字典的方式进行配置参数
    let originSize, originScale, originFormat, originQuality, originOtherRules
    if (validation.isPlainObject(sizeOrConfig)) {
      const { size: sizeOption, scale: scaleOption, format: formatOption, quality: qualityOption, ...otherRulesOption } = sizeOrConfig

      originSize = sizeOption
      originScale = scaleOption
      originFormat = formatOption
      originQuality = qualityOption
      originOtherRules = otherRulesOption
    } else {
      originSize = sizeOrConfig
      originScale = customScale
      originFormat = customformat
      originQuality = customQuality
      originOtherRules = customOtherRules
    }

    logger.log('network:', networkType)
    logger.log('origin image src:', src)
    logger.log('origin image size:', originSize)
    logger.log('origin image format:', originFormat)
    logger.log('origin image scale:', originScale)
    logger.log('origin image quality:', originQuality)
    logger.log('origin rules:', originOtherRules)

    let finalRules = _actions.getFinalOtherRules(originOtherRules) // 最终的其他规则取值
    let finalDPR = _actions.getFinalDPR(networkType, DPR, maxDPR) // 最终的DPR取值
    let finalSize = _actions.getFinalSize(originSize, finalDPR, draftRatio) // 最终的尺寸取值
    let finalFormat = _actions.getFinalFormat(originFormat, _actions.getFileExtension(src), finalSize.split('x')[0], minWidth, finalRules.lossless) // 最终的图片格式
    let finalScale = originScale || scale // 最终的缩放取值
    let finalQuality = originQuality || quality // 最终的质量取值

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

export default ImageFormat
