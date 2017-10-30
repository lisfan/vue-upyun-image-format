/**
 * 又拍云图片尺寸裁切
 *
 * @version 1.0.0
 */

import _ from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

const imageSize = {} // 插件对象
const filterName = 'image-size' // 过滤器名称
const logger = new Logger(`filter-${filterName}`)

/**
 * 暴露install钩子，供vue注册
 * @param {Vue} Vue - Vue构造器类
 * @param {object} [options={}] - 插件配置参数
 * @param {number} [max4gDpr=3] - 4g网络下dpr值取的最大值，默认值为3
 * @param {number} [draftRatio=2] - ui尺寸和设备物理尺寸的比例，默认值为2
 * @param {string} [specs='both'] - 裁剪方式
 * @param {string} [rule=''] - 其他规则，需要以'/'开头，附加上其他规则
 */
imageSize.install = function (Vue, {
  max4gDpr = 3,
  draftRatio = 2,
  specs = 'both',
  rule = ''
} = {}) {
  /**
   * 接受四个参数
   * @param {number|string} size - 裁剪的图片尺寸
   * @param {string} specsType - 又拍云图片裁切规格
   * @param {string} rule - 除图片裁切方式外的，其他又拍云规则
   */
  Vue.filter(filterName, (value, size, specsType = specs, otherRule = rule) => {
    if (_.isUndefined(value)) {
      return ''
    }
    // 非数字和图片时提示参数错误
    if (!_.isNumber(size) && !_.isString(size)) {
      logger.error(`${filterName} require a size param`)
      return false
    }

    const docHtml = document.documentElement
    const dpr = Number.parseFloat(docHtml.getAttribute('data-dpr')) || 1
    const networkType = docHtml.getAttribute('data-network-type') || 'unknow'
    const ratio = draftRatio || Number.parseFloat(docHtml.getAttribute('data-draft-ratio'))

    logger.log('图片地址为value', value)
    logger.log('图片裁剪尺寸为size', size)
    logger.log('图片裁剪方式为specsType', specsType)
    logger.log('其他规格附加otherRule', otherRule)
    logger.log('当前设备dpr值', dpr)
    logger.log('当前设备网络制式', networkType)
    logger.log('当前设计稿与设备比', ratio)

    let finalRatio
    let finalSize

    if ((networkType === 'unknow' || networkType === 'wifi')) {
      finalRatio = dpr
    } else if (networkType === '4g') {
      finalRatio = dpr >= max4gDpr ? max4gDpr : dpr
    }

    const sizeList = size.toString().split('x')

    // 计算尺寸
    const finalSizeList = sizeList.map((sizeItem) => {
      return Math.round((Number.parseFloat(sizeItem) / ratio) * finalRatio)
    })

    finalSize = finalSizeList.join('x')

    logger.log('最终决定图片尺寸的比例是', finalRatio)
    logger.log('最终决定图片尺寸的尺寸是', finalSize)
    logger.log('最终图片url', `${value}!/${specsType}/${finalSize}${otherRule}`)
    return `${value}!/${specsType}/${finalSize}${otherRule}`
  })
}

export default imageSize
