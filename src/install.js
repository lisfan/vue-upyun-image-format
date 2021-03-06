/**
 * @file 又拍云图片处理工具插件
 * @author lisfan <goolisfan@gmail.com>
 * @version 2.0.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

import UpyunImageFormater from './upyun-image-formater'
import getNetworkType from './utils/get-network-type'

const PLUGIN_TYPE = 'filter' // 插件类型
const FILTER_NAMESPACE = 'image-format' // 过滤器名称

export default {
  /**
   * 又拍云图片处理工具注册函数
   * 处理规则请参考[又拍云文档](http://docs.upyun.com/cloud/image/#webp)
   *
   * 若想针对某个值使用默认值，则传入null值即可
   *
   * @global
   *
   * @since 2.0.0
   *
   * @function install
   *
   * @param {Vue} Vue - Vue类
   * @param {object} options={} - 配置选项
   * @param {boolean} [options.debug=false] - 是否开启日志调试模式
   * @param {number} [options.maxDPR=3] - (>=4)g网络或者'unknow'未知网络下，DPR取值的最大数
   * @param {number} [options.draftRatio=2] - UI设计稿尺寸与设备物理尺寸的比例
   * @param {function} [options.networkHandler=()=>{'unknow'}] - 获取网络制式的处理函数，若不存在，返回unknow
   * @param {number} [options.minWidth=global.document.documentElement.clientWidth * global.devicePixelRatio / 2] -
   *   默认值是(当前设备的物理分辨率 * 当前实际设备像素比的) 二分之一
   * @param {string} [options.scale='both'] - 又拍云图片尺寸缩放方式，默认宽度进行自适应，超出尺寸进行裁剪，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪
   * @param {number} [options.quality=90] - 又拍云jpg格式图片压缩质量
   * @param {string|object} [options.rules=''] - (deprecated 使用otherRules代替)又拍云图片处理的其他规则
   * @param {string|object} [options.otherRules=''] - 又拍云图片处理的其他规则

   */
  install(Vue, {
    debug = UpyunImageFormater.options.debug,
    maxDPR = UpyunImageFormater.options.maxDPR,
    draftRatio = UpyunImageFormater.options.draftRatio,
    scale = UpyunImageFormater.options.scale,
    quality = UpyunImageFormater.options.quality,
    rules = UpyunImageFormater.options.otherRules,
    otherRules = UpyunImageFormater.options.otherRules,
    minWidth = UpyunImageFormater.options.minWidth,
    networkHandler = getNetworkType
  } = {}) {
    const logger = new Logger({
      name: `${PLUGIN_TYPE}-${FILTER_NAMESPACE}`,
      debug
    })

    // 插件注册时验证是否会存在网络制式处理器，若不存在，则抛出错误
    if (!validation.isFunction(networkHandler)) {
      return logger.error(`Vue plugin install faild! require a (networkHandler) option property, type is (function), please check!`)
    }

    /**
     * vue过滤器：image-format
     *
     * @since 2.0.0
     *
     * @function image-format
     *
     * @param {string} src - 图片地址，第一个参数vue组件会自动传入，无须管理
     * @param {?number|string|object} [sizeOrConfig] - 裁剪尺寸，取设计稿中的尺寸即可，该值如果是一个字典格式的配置对象，则会其他参数选项的值
     * @param {?string} [scale='both'] - 缩放方式
     * @param {?string} [format] - 图片格式化，系统会根据多种情况来最终确定该值的默认值
     * @param {?number} [quality=90] - 若输出jpg格式图片时的压缩质量
     * @param {?string|object} [otherRules=''] -
     *   又拍云图片处理的的其他规则，注意，如果它是一个字符串格式是，那么它必须是采用`/[key]/[value]`这样的写法，不能随意乱写，同时这里的值不会覆盖前几个参数的值，该项的优先级最低
     *
     * @returns {string}
     */
    Vue.filter(FILTER_NAMESPACE, (src, sizeOrConfig, customScale = scale, customformat, customQuality = quality, customOtherRules = rules || otherRules) => {
      // 如果未传入图片地址，则直接返回空值
      if (validation.isUndefined(src) || validation.isEmpty(src)) {
        return ''
      }

      // 如果size是一个对象，则表示是以字典的方式进行配置参数
      let finalSize, finalScale, finalFormat, finalQuality, finalOtherRules

      if (validation.isPlainObject(sizeOrConfig)) {
        const { size: sizeOption, scale: scaleOption, format: formatOption, quality: qualityOption, ...otherRulesOption } = sizeOrConfig

        finalSize = sizeOption
        finalScale = scaleOption
        finalFormat = formatOption
        finalQuality = qualityOption
        finalOtherRules = otherRulesOption
      } else {
        finalSize = sizeOrConfig
        finalScale = customScale
        finalFormat = customformat
        finalQuality = customQuality
        finalOtherRules = customOtherRules
      }

      const formater = new UpyunImageFormater({
        name: logger.$name,
        debug: logger.$debug,
        networkType: networkHandler(), // 当前网络制式，每次重新获取，因网络随时会变化
        maxDPR,
        draftRatio,
        minWidth,
        src,
        otherRules: finalOtherRules, // 其他规格
        scale: finalScale || scale, // 缩放规格
        size: finalSize, // 图片尺寸
        format: finalFormat, // 图片格式
        quality: finalQuality || quality, // jpg图片压缩质量
      })

      return formater.$finalSrc
    })
  }
}
