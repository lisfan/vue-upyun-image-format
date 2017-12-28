/**
 * @file vue指令插件-图片加载器
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

import isWEBP from './utils/webp-features-support'

import SCALE_PARAM_LEN from './enums/scale-param-len'
import OPTIMIZE_MATCH_FORMAT from './enums/optimize-match-format'

// 私有方法
const _actions = {
  /**
   * 获取自定义的其他又拍云规则项
   * [注] 规则项需要两两对应关系，不可随意填写
   *
   * @since 2.0.0
   *
   * @returns {object}
   */
  getFinalOtherRules(self) {
    // 如果本身已是对象格式，则直接返回
    if (validation.isPlainObject(self.$options.otherRules)) {
      return { ...self.$options.otherRules }
    }

    // 规格是一个字符串格式
    // 处理字符串格式的前尾斜杆'/'

    const TRIM_SLASH_REGEXP = /^\/?(.*?)\/?$/

    const otherRules = self.$options.otherRules.replace(TRIM_SLASH_REGEXP, '$1')

    const rules = otherRules.split('/')

    // 分割后的的数据长度能被2整除，无余数
    if (!validation.isEmpty(otherRules) && rules.length % 2 !== 0) {
      return self._logger.error('other rules is\'t pairs, can\'t parse! please check.')
    }

    const actualOtherRules = {}

    rules.forEach((value, index) => {
      // 条件不符合时，不增加值
      if (index % 2 === 0) actualOtherRules[value] = rules[index + 1]
    })

    return actualOtherRules
  },
  /**
   * 根据当前的网络制式，获取最终的DPR值
   *
   * @since 2.0.0
   *
   * @returns {number}
   */
  getFinalDPR(self) {
    const DPR = global.devicePixelRatio || 1
    const maxDPR = self.$options.maxDPR
    const networkType = self.$options.networkType

    if (networkType === '4g' || networkType === 'unknow') {
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
   * @since 2.0.0
   *
   * @returns {?string}
   */
  getFinalSize(self) {
    const originSize = self.$options.size
    const actualScale = self.$scale
    const actualDPR = self.$DPR
    const draftRatio = self.$options.draftRatio

    // 如果originSize 不存在，则返回
    if (validation.isNil(originSize)) {
      return
    }

    // 存在originSize时
    // 是否存在有效的尺寸值
    const sizeList = originSize.toString().split('x')

    // 四舍五入
    let actualSizeList = sizeList.map((sizeItem) => {
      return Math.round((Number.parseFloat(sizeItem) / draftRatio) * actualDPR)
    })

    // 过滤出数字格式的值
    actualSizeList = actualSizeList.filter((size) => {
      return validation.isNumber(size)
    })

    // 检测缩放所需的尺寸参数长度
    const paramLen = SCALE_PARAM_LEN[actualScale]

    // 截断缩放方式需要的尺寸长度
    actualSizeList = actualSizeList.slice(0, paramLen)

    // 当前截断后有效的长度
    const sizeLen = actualSizeList.length

    // 如果所需尺寸数量大于当前尺寸数量，则进行补全
    if (paramLen > sizeLen) {
      const quotient = Math.ceil(sizeLen / paramLen) + 1

      actualSizeList = (actualSizeList.toString() + ',').repeat(quotient).slice(0, -1).split(',')
      actualSizeList = actualSizeList.slice(0, paramLen)
    }

    return actualSizeList.join('x')
  },
  /**
   * 获取图片后缀
   * 【注】假设图片文件末尾都是以存在后缀的，未兼容处理那些不带后缀形式的图片文件
   *
   * @since 2.0.0
   *
   * @param {string} filename - 文件名称
   *
   * @returns {string}
   */
  getFileExtension(filename) {
    const extReg = /\.([^.]*)$/
    const matched = filename.match(extReg)

    return !matched
      ? ''
      : matched[1]
  },

  /**
   * 根据条件确定默认输出图片格式
   *
   * - 根据浏览器对webp的支持力度及其他一些情况，用户上传的图片如果是非webp格式或jpg格式，如源图是png的，则会按照以下不同的场景转换成webp或jpg
   * - (静态，支持有损webp，图片宽小于设备物理分辨率*dpr的2分之1时或小于200px*dpr时)，使用webp格式（又拍云api: `/format/webp`）
   *  - (静态，支持有损webp，图片宽大于设备物理分辨率*dpr的2分之1时且大于200px*dpr时)，使用jpg格式（又拍云api: `/format/jpg`）
   *  - (静态，不支持webp)，使用jpg格式（又拍云api: `/format/jpg`）
   *  - (动态，支持动态webp时)，使用webp格式（又拍云api: `/format/webp`）
   *  - (动态，不支持动态webp时)，使用gif格式，不作变动
   *
   * @since 2.0.0
   *
   * @returns {string}
   */
  computeDefaultFormat(self) {
    const originExt = _actions.getFileExtension(self.$originSrc)
    // 获取图片宽度
    const width = validation.isString(self.$size) && self.$size.split('x')[0]
    const minWidth = self.$options.minWidth

    // 如果源文件是动态图片且支持动态webp时，则转换为webp
    return originExt === 'gif'
      ? isWEBP.support('animation') ? 'webp' : 'gif'
      : isWEBP.support('lossy') && width >= 0 && minWidth >= width ? 'webp' : 'jpg'
  },
  /**
   * 根据条件，获取最终的图片格式
   *
   * @since 2.0.0
   *
   * @returns {string}
   */
  getFinalFormat(self) {
    const originExt = _actions.getFileExtension(self.$originSrc)
    const originFormat = self.$options.format

    // 若未自定义图片格式，则根据一些条件，设置默认格式
    // 若自定义了图片格式，且不是指定为webp格式，则直接返回指定的格式
    // 若指定为webp格式
    //   - 若源图片gif格式，则检测是否支持动态webp格式，
    //   - 若源图片jpg或png格式，则检测是否支持有损webp格式或无损webp格式
    if (!validation.isString(originFormat)) {
      return _actions.computeDefaultFormat(self)
    }

    // 返回指定了格式且不是指定为webp
    if (originFormat !== 'webp') {
      return originFormat
    }

    // 指定为webp格式，检测是否支持webp相关的特性
    // 若源图片gif格式，若不支持则转换为gif格式
    //   - 若源图片jpg或png格式，则检测是否支持有损webp格式或无损webp格式
    if (originExt === 'gif' && !isWEBP.support('animation')) {
      return 'gif'
    } else if (originExt.match(/jpeg|jpg|png/) && !self.$otherRules.lossless && !isWEBP.support('lossy')) {
      return 'jpg'
    } else if (originExt.match(/jpeg|jpg|png/) && self.$otherRules.lossless && !isWEBP.support('lossless')) {
      return 'jpg'
    } else {
      return 'webp'
    }
  },

  /**
   * 过滤规则中为undefined、null及空值
   *
   * @since 2.0.0
   *
   * @param {object} rules - 规则配置
   *
   * @returns {object}
   */
  filterRules(rules) {
    let filterRules = {}

    Object.entries(rules).forEach(([key, value]) => {
      if (!validation.isNil(value) || !validation.isEmpty(value)) {
        filterRules[key] = value
      }
    })

    return filterRules
  },
  /**
   * 根据图片格式做进一步优化规则
   * 目前只有两条规则，所以不采用策略定义方式，而是简单的直接进行逻辑判断
   *
   * @since 2.0.0
   *
   * @param {object} rules - 优化规则
   *
   * @returns {object}
   */
  optimizeRules(rules) {
    // 若不存在明确的优化禁用，则根据图片格式来启用相应的优化配置
    if (!validation.isBoolean(rules.progressive) && rules.format === 'jpg') {
      rules.progressive = true
    } else if (!validation.isBoolean(rules.compress) && rules.format === 'png') {
      rules.compress = true
    }

    return rules
  },
  /**
   * 针对图片格式，过滤规则
   *
   * 移除某些针对与具体格式或者属性时的规则
   * - 如compress只能用在jpg和png上
   * - 如format不支持值是gif
   * - 如progressive只支持jpg
   * - 如quality只支持jpg
   * - 如lossless只支持webp
   *
   * @since 2.0.2
   *
   * @param {object} rules - 规则配置
   *
   * @returns {object}
   */
  optimizeRulesByFormat(rules) {
    const format = rules.format
    // 未匹配到时进行过滤
    Object.entries(OPTIMIZE_MATCH_FORMAT).forEach(([key, regexp]) => {
      if (!regexp.test(format)) rules[key] = null
    })

    return rules
  },
  /**
   * 序列化规则为符合格式的字符串
   *
   * @since 2.0.0
   *
   * @param {object} rules - 规则配置
   *
   * @returns {string}
   */
  stringifyRule(self) {
    let rules = {
      ...self.$otherRules,
      format: self.$format,
      scale: self.$scale, // 缩放规格
      size: self.$size, // 图片尺寸
      quality: self.$quality, // jpg图片压缩质量
    }

    rules = _actions.optimizeRules(rules)
    rules = _actions.optimizeRulesByFormat(rules)
    rules = _actions.filterRules(rules)

    // 不存在值时，直接返回空字符串
    if (Object.keys(rules).length === 0) {
      return self.$originSrc
    }

    // 提前取出缩放方式(scale)和尺寸(size)进行额外的处理，其他值做拼接
    let imageSrc = validation.isNil(rules.size) ? '' : `/${rules.scale}/${rules.size}`

    // 规则按key名进行排序：解决相同的优化字段时，因key的顺序不同而造成再次进行图片处理
    const sortedRules = Object.entries(rules).sort(([prevKey], [nextKey]) => {
      return prevKey > nextKey
    })

    imageSrc += sortedRules.reduce((result, [key, value]) => {
      return key === 'size' || key === 'scale'
        ? result
        : result + `/${key}/${value}`
    }, '')

    // 规则至少存在一项时，则加上前缀`!`修饰符号
    return validation.isEmpty(imageSrc) ? self.$originSrc : self.$originSrc + '!' + imageSrc
  }
}

/**
 * @classdesc 又拍云图片格式化器类
 *
 * @class
 */
class UpyunImageFormater {
  /**
   * 默认配置选项
   *
   * @since 2.1.0
   *
   * @static
   * @readonly
   * @memberOf UpyunImageFormater
   *
   * @type {object}
   * @property {string} name='upyun-image-formater' - 日志打印器名称标记
   * @property {boolean} debug=false - 日志打印器调试模式开启状态
   * @property {function} networkType='unknow' - 网络制式类型
   * @property {number} maxDPR=3 - (>=4)g网络或者'unknow'未知网络下，DPR取值的最大数
   * @property {number} draftRatio=2 - UI设计稿尺寸与设备物理尺寸的比例
   * @property {number} minWidth=global.document.documentElement.clientWidth * global.devicePixelRatio / 2 -
   * @property {?string} src - 图片地址
   * @property {?string} format - 图片格式
   * @property {string} scale='both' - 又拍云图片尺寸缩放方式，默认宽度进行自适应，超出尺寸进行裁剪，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪
   * @property {?string} size - 图片尺寸
   * @property {number} quality=90 - 又拍云jpg格式图片压缩质量
   * @property {string|object} otherRules='' - 又拍云图片处理的其他规则
   *   默认值是(当前设备的物理分辨率 * 当前实际设备像素比的) 二分之一
   */
  static options = {
    name: 'upyun-image-formater',
    debug: false,
    networkType: 'unknow', // 当前网络制式，每次重新获取，因网络随时会变化
    maxDPR: 3,
    draftRatio: 2,
    minWidth: global.document.documentElement.clientWidth * global.devicePixelRatio / 2,
    src: undefined,
    format: undefined,
    scale: 'both',
    size: undefined,
    quality: 90,
    otherRules: {},
  }

  /**
   * 更新默认配置选项
   *
   * @since 2.1.0
   *
   * @param {object} options - 配置参数
   *
   * @see 配置选项见{@link UpyunImageFormater.options}
   *
   * @returns {UpyunImageFormater}
   */
  static config(options) {
    const ctor = this
    ctor.options = {
      ...ctor.options,
      options
    }

    return ctor
  }

  /**
   * 构造函数
   *
   * @param {object} options - 配置选项见{@link UpyunImageFormater.options}
   */
  constructor(options) {
    const ctor = this.constructor
    this.$options = {
      ...ctor.options,
      ...options
    }

    this._logger = new Logger({
      name: this.$options.name,
      debug: this.$options.debug
    })

    // 以下调用顺序不能反
    // 其他规则
    this._otherRules = _actions.getFinalOtherRules(this)

    // 最终的DPR
    this._DPR = _actions.getFinalDPR(this)

    // 最终的图片尺寸
    this._size = _actions.getFinalSize(this)

    // 最终的图片格式
    this._format = _actions.getFinalFormat(this)

    // 拼接最终的结果
    this._actualSrc = _actions.stringifyRule(this)
  }

  /**
   * 日志打印器，方便调试
   *
   * @since 2.1.0
   *
   * @private
   */
  _logger = undefined

  /**
   * 实例初始配置项
   *
   * @since 2.1.0
   *
   * @readonly
   *
   * @type {object}
   */
  $options = undefined

  /**
   * 获取实例的原图片地址
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $originSrc() {
    return this.$options.src
  }

  _actualSrc = undefined

  /**
   * 获取实例的最终格式化后的图片地址
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $actualSrc() {
    return this._actualSrc
  }

  _otherRules = undefined

  /**
   * 获取实例的其他规则项
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {object}
   */
  get $otherRules() {
    return this._otherRules
  }

  _DPR = undefined

  /**
   * 获取实例的格式化DPR规则
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {number}
   */
  get $DPR() {
    return this._DPR
  }

  _format = undefined

  /**
   * 获取实例的格式化类型规则
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $format() {
    return this._format
  }

  _size = undefined

  /**
   * 获取实例的格式化尺寸规则
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $size() {
    return this._size
  }

  /**
   * 获取实例的格式化缩放规则
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $scale() {
    return this.$options.scale
  }

  /**
   * 获取实例的格式化质量规则
   *
   * @since 2.1.0
   *
   * @getter
   * @readonly
   *
   * @type {number}
   */
  get $quality() {
    return this.$options.quality

  }
}

export default UpyunImageFormater