import converters from './converters.js'

class TabRunner {
  constructor (tabId, userData) {
    this.tabId = tabId
    this.userData = userData
  }

  async runActions (actions) {
    let result
    for (const action of actions) {
      await this.runAction(action)
    }
    return result
  }

  async runAction (action) {
    console.log('Running', action)
    const actionCode = this.getActionCode(action)
    return await this.runScript(actionCode)
  }

  async runScript (actionCode) {
    if (actionCode.length === 0) {
      return
    }
    let result = await browser.tabs.executeScript(
      this.tabId, {
        code: actionCode[0]
      })
    result = result[0]
    if (actionCode.length === 1) {
      return result
    }
    return actionCode[1](result)
  }

  getActionCode (action) {
    if (action.fill) {
      if (this.userData[action.fill.key]) {
        return [`document.querySelector('${action.fill.selector}').value = '${this.userData[action.fill.key]}'`]
      } else {
        return []
      }
    } else if (action.failOnMissing) {
      return [
        `document.querySelector('${action.failOnMissing}') !== null`,
        function (result) {
          if (result === true) {
            return result
          }
          throw new Error(action.failure)
        }
      ]
    } else if (action.click) {
      if (action.optional) {
        return [`var el = document.querySelector('${action.click}'); el && el.click()`]
      } else {
        return [`document.querySelector('${action.click}').click()`]
      }
    } else if (action.url) {
      return [`document.location.href = '${action.url}';`]
    } else if (action.extract) {
      return [
        `Array.from(document.querySelectorAll('${action.extract}')).map(function(el) {
          return el.outerHTML
        })`,
        function (result) {
          if (result.length > 0 && action.convert) {
            result = converters[action.convert](result)
          }
          return result
        }]
    }
  }
}

export default TabRunner
