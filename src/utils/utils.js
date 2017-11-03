/**
 * 模拟 lodash API
 */
import validation from '@~lisfan/validation'

export default {
  /**
   * 移除了数组中所有的假值。例如：false、null、 0、""、undefined， 以及NaN 都是 “假值”.
   *
   * @since 1.0.0
   * @param {array} array - 数组
   * @return {array}
   */
  compact(array) {
    return array.filter((item) => {
      return !!item
    })
  },
  /**
   * 如果 value 不是数组, 那么强制转为数组
   *
   * @since 1.0.0
   * @param {*} value - 任意值
   * @returns {array}
   */
  castArray(value) {
    return validation.isArray(value) ? value : [value]
  },
  /**
   * 创建一个新对象，对象的key相同，值是通过 iteratee 产生的。
   * iteratee 会传入3个参数： (value, key, object)
   *
   * @since 1.0.0
   * @param {object} obj - 对象
   * @param {function} iterate - 迭代函数
   * @returns {object}
   */
  mapValues(obj, iterate) {
    let newObj = {}

    Object.entries(obj).forEach(([key, value]) => {
      newObj[key] = iterate(value, key, obj)
    })

    return newObj
  }

}